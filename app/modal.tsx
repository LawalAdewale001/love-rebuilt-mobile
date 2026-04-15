import { showToast } from "@/components/ui/toast";
import {
  useDiscoveryPreferencesQuery,
  useUpdateDiscoveryPreferencesMutation,
} from "@/lib/queries";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOOKING_FOR_OPTIONS = ["Long-term relationship", "New friends", "A Wife"];

export default function FilterModalScreen() {
  const router = useRouter();

  // 1. Hook up the API Queries
  const { data: preferences, isLoading } = useDiscoveryPreferencesQuery();
  const updateMutation = useUpdateDiscoveryPreferencesMutation();

  // 2. States (with fallback defaults)
  const [ageFrom, setAgeFrom] = useState("20");
  const [ageTo, setAgeTo] = useState("30");
  const [distance, setDistance] = useState("50");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [childrenPref, setChildrenPref] = useState("No Preference"); // State for children pref

  // 3. Populate state when API data arrives
  useEffect(() => {
    // We assume your backend returns these fields. If they are named differently (e.g., min_age), adjust here!
    if (preferences?.data?.result || preferences?.result || preferences) {
      const prefs =
        preferences?.data?.result || preferences?.result || preferences;

      if (prefs.minAge) setAgeFrom(String(prefs.minAge));
      if (prefs.maxAge) setAgeTo(String(prefs.maxAge));
      if (prefs.maxDistance) setDistance(String(prefs.maxDistance));
      if (prefs.lookingFor) setLookingFor(prefs.lookingFor);
      if (typeof prefs.onlyVerified === "boolean")
        setOnlyVerified(prefs.onlyVerified);
      if (prefs.childrenPreference) setChildrenPref(prefs.childrenPreference);
    }
  }, [preferences]);

  const toggleLookingFor = (option: string) => {
    if (lookingFor.includes(option)) {
      setLookingFor(lookingFor.filter((item) => item !== option));
    } else {
      setLookingFor([...lookingFor, option]);
    }
  };

  const handleApply = () => {
    // Format the payload to send to your backend
    const payload = {
      minAge: parseInt(ageFrom) || 20,
      maxAge: parseInt(ageTo) || 30,
      maxDistance: parseInt(distance) || 50,
      lookingFor,
      onlyVerified,
      childrenPreference: childrenPref,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        // Because your mutation invalidates "discoveryGeneral" and "discoveryMatches",
        // routing back will immediately show the newly filtered profiles!
        router.back();
      },
      onError: (err: any) => {
        showToast(
          "error",
          "Filter Error",
          err?.message || "Could not save preferences",
        );
      },
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      {/* Header */}
      <Box
        px="$6"
        py="$4"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Filter
        </Text>
        <Pressable
          position="absolute"
          right={24}
          onPress={() => router.back()}
          p="$2"
          w={32}
          h={32}
          justifyContent="center"
          alignItems="center"
          disabled={updateMutation.isPending}
        >
          <Image
            source={require("@/assets/images/VectorCancel.png")}
            style={{ width: 19.13, height: 19.13 }}
            contentFit="contain"
          />
        </Pressable>
      </Box>

      {/* Show a spinner while initial preferences load */}
      {isLoading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="#E86673" />
        </Box>
      ) : (
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack px="$6" py="$4" space="2xl">
            {/* Age Range */}
            <VStack space="sm">
              <Text size="lg" color="$textLight900">
                Age Range
              </Text>
              <Text size="sm" color="$textLight500" mt="-$1">
                Enter the age range you're interested in
              </Text>

              <HStack space="md" mt="$2">
                <Box flex={1}>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    h={65}
                  >
                    <VStack pl="$4" py="$1.5" justifyContent="center">
                      <Text size="xs" color="$textLight500">
                        From
                      </Text>
                      <InputField
                        p={0}
                        h={24}
                        value={ageFrom}
                        onChangeText={setAgeFrom}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                      />
                    </VStack>
                  </Input>
                </Box>
                <Box flex={1}>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    h={65}
                  >
                    <VStack pl="$4" py="$1.5" justifyContent="center">
                      <Text size="xs" color="$textLight500">
                        To
                      </Text>
                      <InputField
                        p={0}
                        h={24}
                        value={ageTo}
                        onChangeText={setAgeTo}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                      />
                    </VStack>
                  </Input>
                </Box>
              </HStack>
            </VStack>

            {/* Max Distance */}
            <VStack space="sm">
              <Text size="lg" color="$textLight900">
                Max Distance
              </Text>
              <Text size="sm" color="$textLight500" mt="-$1">
                Set the maximum distance for matches
              </Text>

              <Input
                mt="$2"
                size="xl"
                variant="outline"
                borderRadius="$xl"
                bg="#F7F5F4"
                borderWidth={1}
                borderColor="#1A1A1A"
                h={65}
              >
                <VStack pl="$4" py="$1.5" justifyContent="center">
                  <Text size="xs" color="$textLight500">
                    Distance (km)
                  </Text>
                  <InputField
                    p={0}
                    h={24}
                    value={distance}
                    onChangeText={setDistance}
                    fontWeight="$bold"
                    size="md"
                    keyboardType="numeric"
                  />
                </VStack>
              </Input>
            </VStack>

            {/* Looking For (Custom Checkboxes) */}
            <VStack space="sm">
              <Text size="lg" color="$textLight900">
                Looking For
              </Text>
              <Text size="sm" color="$textLight500" mt="-$1">
                Select what you're looking for in a match
              </Text>

              <VStack space="lg" mt="$4">
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const isChecked = lookingFor.includes(opt);
                  return (
                    <Pressable key={opt} onPress={() => toggleLookingFor(opt)}>
                      <HStack alignItems="center" space="md">
                        <Box
                          w={24}
                          h={24}
                          borderRadius={6}
                          borderWidth={isChecked ? 0 : 1}
                          borderColor={isChecked ? "transparent" : "#E86673"}
                          bg={isChecked ? "#E86673" : "transparent"}
                          justifyContent="center"
                          alignItems="center"
                        >
                          {isChecked && (
                            <Text color="#FFFFFF" size="sm" fontWeight="bold">
                              ✓
                            </Text>
                          )}
                        </Box>
                        <Text size="md" color="$textLight900">
                          {opt}
                        </Text>
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            </VStack>

            {/* Children Preference */}
            <VStack space="sm">
              <Text size="lg" color="$textLight900">
                Children
              </Text>
              <Text size="sm" color="$textLight500" mt="-$1">
                Indicate your preference regarding children
              </Text>

              <Pressable mt="$2">
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={1}
                  borderColor="#1A1A1A"
                  h={65}
                  isReadOnly
                >
                  <VStack pl="$4" py="$1.5" justifyContent="center">
                    <Text size="xs" color="$textLight500">
                      Children Preference
                    </Text>
                    <InputField
                      p={0}
                      h={24}
                      value={childrenPref}
                      fontWeight="$bold"
                      size="md"
                      pointerEvents="none" // Can be tied to an ActionSheet later if needed
                    />
                  </VStack>
                </Input>
              </Pressable>
            </VStack>

            {/* Show Only Verified Toggle */}
            <HStack alignItems="center" justifyContent="space-between" mt="$2">
              <VStack>
                <Text size="lg" color="$textLight900">
                  Show Only Verified
                </Text>
                <Text size="sm" color="$textLight500">
                  Display only verified profiles
                </Text>
              </VStack>
              <Switch
                value={onlyVerified}
                onValueChange={setOnlyVerified}
                trackColor={{ false: "#E5E5E5", true: "#E86673" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E5E5"
              />
            </HStack>
          </VStack>
        </ScrollView>
      )}

      {/* Footer / Apply Button */}
      <Box
        px="$6"
        pt="$4"
        pb={Platform.OS === "ios" ? "$8" : "$16"}
        bg="#FFFFFF"
      >
        <Button
          w="100%"
          size="xl"
          bg="#E86673"
          borderRadius="$full"
          onPress={handleApply}
          disabled={updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending ? (
            <ButtonSpinner color="#FFFFFF" />
          ) : (
            <ButtonText fontWeight="$bold">Apply Filter</ButtonText>
          )}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
