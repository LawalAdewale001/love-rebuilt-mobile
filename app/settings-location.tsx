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
  VStack
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
      setFetchCurrent(false);
      handleSave(currentLocData.location);
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
            placeholder="Enter a new location"
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
              searchResults?.map((loc: any, i: number) => {
                const locName = loc.name || loc.formattedAddress || loc;
                return (
                  <Pressable key={i} onPress={() => handleSave(locName)}>
                    <HStack space="md" alignItems="center">
                      <Image
                        source={require("@/assets/images/icon-location-pin-pink.png")}
                        style={{ width: 24, height: 24 }}
                        contentFit="contain"
                      />
                      <VStack>
                        <Text fontWeight="$medium" color="$textLight900">
                          {locName.split(",")[0]}
                        </Text>
                        <Text color="$textLight500" size="sm">
                          {locName}
                        </Text>
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
