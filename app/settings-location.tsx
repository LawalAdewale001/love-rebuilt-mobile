import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  useCurrentLocationQuery,
  useLocationSearchQuery,
  useUpdateProfileMutation,
} from "@/lib/queries";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Box,
  ButtonSpinner,
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
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsLocationScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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
      const detectedCountry = currentLocData.countryCode || currentLocData.country_code || currentLocData.country || "NG";
      setCountryCode(detectedCountry);
      setFetchCurrent(false);
      showToast("success", "Country Selected", `Search restricted to ${detectedCountry}`);
    }
  }, [currentLocData]);

  const handleSave = (locToSave: string) => {
    updateMutation.mutate(
      { location: locToSave },
      {
        onSuccess: () => {
          showToast("success", "Success", "Location updated!");
          router.back();
        },
        onError: () =>
          showToast("error", "Error", "Failed to update location."),
      },
    );
  };

  // Helper to format the display name if the backend returns an object
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
      {/* Header */}
      <HStack
        px="$6"
        py="$4"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <VStack>
          <Text size="xl" fontWeight="$bold" color="$textLight900">
            Location
          </Text>
          <Text size="sm" color="$textLight500" mt="$1">
            Make changes to your location
          </Text>
        </VStack>
        <Pressable
          p="$2"
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$full"
          w={32}
          h={32}
          justifyContent="center"
          alignItems="center"
          onPress={() => router.back()}
        >
          <MaterialIcons name="close" size={16} color="#1A1A1A" />
        </Pressable>
      </HStack>

      <VStack px="$6" pt="$4" space="lg" flex={1}>
        <Input
          size="xl"
          variant="outline"
          borderRadius="$full"
          borderColor="$borderLight300"
          borderWidth={1}
          bg="#FFFFFF"
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
            onChangeText={setSearchQuery}
          />
        </Input>

        <Pressable onPress={() => setFetchCurrent(true)}>
          <HStack alignItems="center" space="sm">
            {isFetchingCurrent ? (
              <ButtonSpinner color={PRIMARY_COLOR} mr="$2" />
            ) : (
              <Image
                source={require("@/assets/images/icon-location-pin-pink.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor={PRIMARY_COLOR}
              />
            )}
            <Text color={PRIMARY_COLOR} fontWeight="$bold" size="md">
              Use your current location
            </Text>
          </HStack>
        </Pressable>

        <Box
          borderBottomWidth={1}
          borderBottomColor="$borderLight100"
          mt="$2"
        />

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack space="lg" pb="$8" mt="$4">
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

                // Match design: mainTitle is usually the matched query/city (loc.name)
                // subtitle is the full descriptive string
                const parts = typeof locName === "string" ? locName.split(",") : [""];
                const mainTitle = loc?.name || loc?.city || parts[0];
                const subtitle = loc?.formattedAddress || locName;

                return (
                  <Pressable key={i} onPress={() => handleSave(locName)}>
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
                          color="#1A1A1A"
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
      </VStack>
    </SafeAreaView>
  );
}
