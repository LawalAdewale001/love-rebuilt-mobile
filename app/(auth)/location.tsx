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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } =
    useLocationSearchQuery(debouncedQuery);
  const { data: currentLocData, isFetching: isFetchingCurrent } =
    useCurrentLocationQuery(fetchCurrent);

  useEffect(() => {
    if (currentLocData?.location) {
      setSelectedLocation(currentLocData.location);
      setSearchQuery(currentLocData.location);
      setFetchCurrent(false);
      showToast("success", "Location Found", currentLocData.location);
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
            placeholder="E.g. Lagos, Nigeria or London, UK"
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

                // Split for UI display: "City" on top, "State, Country" below
                const parts = locName.split(",");
                const mainTitle = parts[0];
                const subtitle = parts.slice(1).join(",").trim();

                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setSelectedLocation(locName);
                      setSearchQuery(locName);
                    }}
                  >
                    <HStack space="md" alignItems="center">
                      <Image
                        source={require("@/assets/images/icon-location-pin-pink.png")}
                        style={{ width: 24, height: 24 }}
                        contentFit="contain"
                      />
                      <VStack>
                        <Text
                          fontWeight="$medium"
                          color={isSelected ? "#E86673" : "$textLight900"}
                        >
                          {mainTitle}
                        </Text>
                        {subtitle ? (
                          <Text color="$textLight500" size="sm">
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
