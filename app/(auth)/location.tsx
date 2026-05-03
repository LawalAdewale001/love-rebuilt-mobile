import { OnboardingHeader } from "@/components/ui/onboarding-header";
import { showToast } from "@/components/ui/toast";
import {
  useCurrentLocationQuery,
  useLocationSearchQuery,
  useUpdateProfileMutation,
} from "@/lib/queries";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [fetchCurrent, setFetchCurrent] = useState(false);
  const [countryCode, setCountryCode] = useState("NG");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } =
    useLocationSearchQuery(debouncedQuery, countryCode);
  const { data: currentLocData, isFetching: isFetchingCurrent } =
    useCurrentLocationQuery(fetchCurrent);

  useEffect(() => {
    if (currentLocData) {
      // The API might return country, countryCode, or country_code.
      const detectedCountry = currentLocData.countryCode || currentLocData.country_code || currentLocData.country || "NG";
      setCountryCode(detectedCountry);
      setFetchCurrent(false);
      showToast("success", "Country Selected", `Search restricted to ${detectedCountry}`);
    }
  }, [currentLocData]);

  const handleContinue = () => {
    if (!selectedLocation) return;
    updateMutation.mutate(
      { location: selectedLocation },
      {
        onSuccess: () => router.push("/birth-details"),
        onError: (err: any) =>
          showToast(
            "error",
            "Error",
            err?.message || "Failed to save location",
          ),
      },
    );
  };

  // Helper to format the display name if the backend returns an object
  // Adjust this based on your exact backend response schema!
  const formatLocationDisplay = (loc: any) => {
    if (typeof loc === "string") return loc;

    if (loc.type === "country") {
      return loc.name;
    }

    if (loc.name && loc.state && loc.country) {
      return `${loc.name}, ${loc.state}, ${loc.country}`;
    }

    if (loc.name && loc.country) {
      return `${loc.name}, ${loc.country}`;
    }

    // If backend returns distinct fields:
    if (loc.city && loc.state && loc.country) {
      return `${loc.city}, ${loc.state}, ${loc.country}`;
    }

    // Fallback to name or formatted address
    return loc.formattedAddress || loc.name || "Unknown Location";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={25} />
      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Your Location
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          Where are you based?
        </Text>

        <Input
          size="xl"
          variant="outline"
          borderRadius="$full"
          mt="$6"
          borderColor={selectedLocation ? "#1A1A1A" : "#E86673"}
        >
          <InputSlot pl="$4">
            <Image
              source={require("@/assets/images/icon-search.png")}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
          </InputSlot>
          <InputField
            placeholder="Enter Your location"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSelectedLocation("");
            }}
          />
        </Input>

        <Pressable onPress={() => setFetchCurrent(true)} mt="$6">
          <HStack alignItems="center" space="sm">
            {isFetchingCurrent ? (
              <ButtonSpinner color="#E86673" mr="$2" />
            ) : (
              <Image
                source={require("@/assets/images/icon-location-pin-pink.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            )}
            <Text color="#E86673" fontWeight="$bold" size="md">
              Use your current location
            </Text>
          </HStack>
        </Pressable>

        <Divider mt="$4" mb="$4" bg="$borderLight200" />

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack space="lg" pb="$24">
            {isLoading && (
              <Text color="$textLight500" textAlign="center">
                Searching...
              </Text>
            )}

            {!isLoading &&
              searchResults &&
              searchResults.length === 0 &&
              debouncedQuery.length > 2 && (
                <Text color="$textLight500" textAlign="center">
                  No locations found in Nigeria or the UK.
                </Text>
              )}

            {!isLoading &&
              searchResults?.map((loc: any, i: number) => {
                const locName = formatLocationDisplay(loc);
                const isSelected = selectedLocation === locName;

                // Match design: mainTitle is usually the matched query/city (loc.name)
                // subtitle is the full descriptive string
                const parts = typeof locName === "string" ? locName.split(",") : [""];
                const mainTitle = loc?.name || loc?.city || parts[0];
                const subtitle = loc?.formattedAddress || locName;

                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setSelectedLocation(locName);
                      setSearchQuery(locName);
                    }}
                  >
                    <HStack 
                      space="md" 
                      alignItems="flex-start" 
                      py="$4" 
                      borderBottomWidth={1} 
                      borderBottomColor="$borderLight100"
                    >
                      <Image
                        source={require("@/assets/images/icon-location-pin-pink.png")}
                        style={{ width: 20, height: 20, marginTop: 2 }}
                        contentFit="contain"
                      />
                      <VStack flex={1}>
                        <Text
                          fontSize={16}
                          fontWeight="400"
                          color={isSelected ? "#E86673" : "#1A1A1A"}
                        >
                          {mainTitle}
                        </Text>
                        {subtitle && subtitle !== mainTitle ? (
                          <Text color="#8F8F8F" fontSize={14} mt={2}>
                            {subtitle}
                          </Text>
                        ) : null}
                      </VStack>
                    </HStack>
                  </Pressable>
                );
              })}
          </VStack>
        </ScrollView>

        <Box position="absolute" bottom={32} left={24} right={24}>
          <Button
            size="xl"
            bg={selectedLocation ? "#E86673" : "#F4F3F2"}
            borderRadius="$full"
            disabled={!selectedLocation || updateMutation.isPending}
            onPress={handleContinue}
            style={
              selectedLocation
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 3,
                  }
                : {}
            }
          >
            {updateMutation.isPending ? (
              <ButtonSpinner color="#FFFFFF" />
            ) : (
              <ButtonText
                fontWeight="$bold"
                color={selectedLocation ? "#FFFFFF" : "$textLight400"}
              >
                Continue
              </ButtonText>
            )}
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
