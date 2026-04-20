import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import { useS3Upload } from "@/hooks/use-s3-upload";
import {
  useDiscoveryPreferencesQuery,
  useProfileQuery,
  useUpdateDiscoveryPreferencesMutation,
  useUpdateProfileMutation,
} from "@/lib/queries";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOOKING_FOR_OPTIONS = ["Long-term relationship", "New friends", "A Wife"];

// --- Reusable Sub-components ---
const SectionHeader = ({ title }: { title: string }) => (
  <Text
    size="sm"
    fontWeight="$medium"
    color="$textLight500"
    mt="$6"
    mb="$2"
    px="$6"
  >
    {title}
  </Text>
);

const SettingsItem = ({
  iconName,
  title,
  subtitle,
  type = "link",
  value,
  onValueChange,
  onPress,
  showDivider = true,
}: any) => (
  <Box px="$6">
    <Pressable
      onPress={type === "link" ? onPress : undefined}
      py="$4"
      disabled={type === "toggle"}
    >
      <HStack space="md" alignItems="center">
        <Box
          w={44}
          h={44}
          bg={PRIMARY_COLOR}
          borderRadius="$full"
          justifyContent="center"
          alignItems="center"
          opacity={0.9}
        >
          <MaterialIcons name={iconName} size={20} color="#FFFFFF" />
        </Box>
        <VStack flex={1} space="xs">
          <Text size="md" fontWeight="$bold" color="$textLight900">
            {title}
          </Text>
          <Text size="sm" color="$textLight500">
            {subtitle}
          </Text>
        </VStack>
        <Box pl="$2">
          {type === "link" ? (
            <MaterialIcons name="chevron-right" size={24} color="#666666" />
          ) : (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ false: "#E5E5E5", true: PRIMARY_COLOR }}
              thumbColor="#FFFFFF"
              style={{
                transform: [{ scale: Platform.OS === "ios" ? 0.8 : 1 }],
              }}
            />
          )}
        </Box>
      </HStack>
    </Pressable>
    {showDivider && <Divider bg="$borderLight100" />}
  </Box>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { data: profile } = useProfileQuery();
  const { data: discoveryPrefs } = useDiscoveryPreferencesQuery();

  const updateProfileMutation = useUpdateProfileMutation();
  const updatePrefsMutation = useUpdateDiscoveryPreferencesMutation();
  const { upload } = useS3Upload();

  // --- UI States ---
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // --- Profile Form States ---
  const [fullName, setFullName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // --- Discovery Form States ---
  const [minAge, setMinAge] = useState("20");
  const [maxAge, setMaxAge] = useState("30");
  const [maxDistance, setMaxDistance] = useState("50");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [childrenPref, setChildrenPref] = useState("No Children");

  // Privacy Settings
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  // Sync profile data to state
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setBio((profile as any).bio || "");
      setAvatarUri(profile.avatar || profile.pictures?.[0] || null);
      if (profile.dob) {
        const [y, m, d] = profile.dob.split("-");
        setYear(y || "");
        setMonth(m || "");
        setDay(d || "");
      }
    }
  }, [profile]);

  // Sync discovery preferences to state
  useEffect(() => {
    if (discoveryPrefs) {
      setMinAge(discoveryPrefs.minAge?.toString() || "20");
      setMaxAge(discoveryPrefs.maxAge?.toString() || "30");
      setMaxDistance(discoveryPrefs.maxDistance?.toString() || "50");
      setLookingFor(discoveryPrefs.lookingFor || []);
      setChildrenPref(discoveryPrefs.childrenPreference || "No Children");
    }
  }, [discoveryPrefs]);

  const closeSheet = () => setActiveSheet(null);
  const toggleLookingFor = (option: string) => {
    setLookingFor((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  };

  // --- Handlers ---
  const handleUpdateProfile = async () => {
    setIsUploading(true);
    try {
      let finalAvatarUrl = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http")) {
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const result = await upload(avatarUri, fileName, "image/jpeg");
        if (result?.fileUrl) finalAvatarUrl = result.fileUrl;
      }

      const payload: any = {};
      if (fullName.trim()) payload.fullName = fullName.trim();
      if (finalAvatarUrl) {
        payload.avatar = finalAvatarUrl;
        const existingPictures = profile?.pictures || [];
        payload.pictures = [
          finalAvatarUrl,
          ...existingPictures.filter((p) => p !== profile?.avatar),
        ];
      }
      if (year && month && day && year.length === 4) {
        payload.dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      updateProfileMutation.mutate(payload, {
        onSuccess: () => {
          showToast("success", "Saved", "Profile updated.");
          closeSheet();
        },
        onError: (err: any) =>
          showToast(
            "error",
            "Error",
            err?.message || "Failed to update profile.",
          ),
      });
    } catch (err) {
      showToast("error", "Upload Error", "Failed to upload your photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateAbout = () => {
    updateProfileMutation.mutate({ bio: bio.trim() } as any, {
      onSuccess: () => {
        showToast("success", "Saved", "Bio updated.");
        closeSheet();
      },
      onError: (err: any) =>
        showToast("error", "Error", err?.message || "Failed to update bio."),
    });
  };

  const handleUpdateDiscovery = () => {
    updatePrefsMutation.mutate(
      {
        minAge: parseInt(minAge) || 18,
        maxAge: parseInt(maxAge) || 50,
        maxDistance: parseInt(maxDistance) || 50,
        lookingFor,
        childrenPreference: childrenPref,
      },
      {
        onSuccess: () => {
          showToast("success", "Saved", "Discovery preferences updated.");
          closeSheet();
        },
        onError: (err: any) =>
          showToast(
            "error",
            "Error",
            err?.message || "Failed to update preferences.",
          ),
      },
    );
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri)
      setAvatarUri(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box
        px="$6"
        py="$4"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Pressable
          position="absolute"
          left={24}
          onPress={() => router.back()}
          p="$2"
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$full"
          w={36}
          h={36}
          justifyContent="center"
          alignItems="center"
        >
          <MaterialIcons name="arrow-back" size={18} color="#1A1A1A" />
        </Pressable>
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Settings
        </Text>
      </Box>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack pb="$10">
          <SectionHeader title="Account Settings" />
          <SettingsItem
            iconName="person-outline"
            title="Edit Profile"
            subtitle="Change your name, age, & photo"
            onPress={() => setActiveSheet("edit-profile")}
          />
          <SettingsItem
            iconName="info-outline"
            title="About Me"
            subtitle="Make changes to your bio"
            onPress={() => setActiveSheet("about-me")}
          />
          <SettingsItem
            iconName="place"
            title="Location"
            subtitle={profile?.location || "Lagos, Nigeria"}
            onPress={() => router.push("/settings-location")}
          />
          <SettingsItem
            iconName="tune"
            title="Discovery Preferences"
            subtitle="Adjust your match preferences"
            showDivider={false}
            onPress={() => setActiveSheet("discovery")}
          />

          <SectionHeader title="Notifications" />
          <SettingsItem
            iconName="notifications-none"
            title="Push Notifications"
            subtitle="Get notified about matches"
            type="toggle"
            value={pushNotifs}
            onValueChange={setPushNotifs}
            showDivider={false}
          />

          <SectionHeader title="Privacy" />
          <SettingsItem
            iconName="shield"
            title="Privacy Settings"
            subtitle="Control what people see"
            onPress={() => setActiveSheet("privacy")}
          />
          <SettingsItem
            iconName="block"
            title="Blocked Users"
            subtitle="Manage blocked accounts"
            showDivider={false}
            onPress={() => setActiveSheet("blocked")}
          />

          <Box px="$6" mt="$10" alignItems="center">
            <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
              <HStack space="sm" alignItems="center">
                <MaterialIcons name="logout" size={20} color={PRIMARY_COLOR} />
                <Text color={PRIMARY_COLOR} fontWeight="$bold" size="md">
                  Logout
                </Text>
              </HStack>
            </Pressable>
          </Box>
        </VStack>
      </ScrollView>

      {/* --- BOTTOM SHEETS --- */}
      <Actionsheet
        isOpen={activeSheet !== null}
        onClose={closeSheet}
        snapPoints={[85]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent
          bg="#FFFFFF"
          borderTopLeftRadius="$3xl"
          borderTopRightRadius="$3xl"
          px="$6"
          pb="$8"
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator
              bg="$borderLight300"
              w="$16"
              mt="$2"
              mb="$4"
            />
          </ActionsheetDragIndicatorWrapper>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: "100%" }}
          >
            {/* 1. EDIT PROFILE */}
            {activeSheet === "edit-profile" && (
              <VStack space="lg" w="100%">
                <VStack>
                  <Text size="xl" fontWeight="$bold" color="$textLight900">
                    Edit Profile
                  </Text>
                  <Text size="sm" color="$textLight500">
                    Change your name, photo, and age
                  </Text>
                </VStack>
                <Box alignItems="center" py="$4">
                  <Pressable
                    onPress={pickAvatar}
                    w={100}
                    h={100}
                    borderRadius="$full"
                    bg="#F7F5F4"
                    justifyContent="center"
                    alignItems="center"
                    overflow="hidden"
                    position="relative"
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <MaterialIcons name="person" size={40} color="#CCCCCC" />
                    )}
                    <Box
                      position="absolute"
                      bottom={0}
                      w="100%"
                      bg="rgba(0,0,0,0.5)"
                      py="$1"
                      alignItems="center"
                    >
                      <Text size="xs" color="#FFF">
                        Edit
                      </Text>
                    </Box>
                  </Pressable>
                </Box>
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
                      Full Name
                    </Text>
                    <InputField
                      p={0}
                      h={24}
                      value={fullName}
                      onChangeText={setFullName}
                      fontWeight="$bold"
                      size="md"
                    />
                  </VStack>
                </Input>
                <HStack space="md" w="100%">
                  <VStack
                    flex={1}
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
                    h={65}
                    pl="$4"
                    justifyContent="center"
                  >
                    <Text size="xs" color="$textLight500">
                      Day
                    </Text>
                    <Input h={24} p={0} borderWidth={0}>
                      <InputField
                        p={0}
                        value={day}
                        onChangeText={setDay}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </Input>
                  </VStack>
                  <VStack
                    flex={1}
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
                    h={65}
                    pl="$4"
                    justifyContent="center"
                  >
                    <Text size="xs" color="$textLight500">
                      Month
                    </Text>
                    <Input h={24} p={0} borderWidth={0}>
                      <InputField
                        p={0}
                        value={month}
                        onChangeText={setMonth}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </Input>
                  </VStack>
                  <VStack
                    flex={1.2}
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
                    h={65}
                    pl="$4"
                    pr="$2"
                    justifyContent="center"
                  >
                    <Text size="xs" color="$textLight500">
                      Year
                    </Text>
                    <Input h={24} p={0} borderWidth={0}>
                      <InputField
                        p={0}
                        value={year}
                        onChangeText={setYear}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </Input>
                  </VStack>
                </HStack>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$4"
                  disabled={updateProfileMutation.isPending || isUploading}
                  onPress={handleUpdateProfile}
                >
                  {updateProfileMutation.isPending || isUploading ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Profile</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 2. ABOUT ME */}
            {activeSheet === "about-me" && (
              <VStack space="lg" w="100%">
                <VStack>
                  <Text size="xl" fontWeight="$bold" color="$textLight900">
                    About Me
                  </Text>
                  <Text size="sm" color="$textLight500">
                    Make changes to your bio
                  </Text>
                </VStack>
                <Box
                  borderWidth={1}
                  borderColor="#1A1A1A"
                  borderRadius="$2xl"
                  bg="#F7F5F4"
                  overflow="hidden"
                >
                  <Textarea
                    size="md"
                    w="100%"
                    h={180}
                    borderWidth={0}
                    bg="transparent"
                  >
                    <Text
                      position="absolute"
                      top={10}
                      left={16}
                      size="xs"
                      color="$textLight500"
                      zIndex={10}
                    >
                      About Me
                    </Text>
                    <TextareaInput
                      pt="$8"
                      px="$4"
                      color="$textLight900"
                      fontWeight="$medium"
                      value={bio}
                      onChangeText={setBio}
                    />
                  </Textarea>
                </Box>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$4"
                  disabled={updateProfileMutation.isPending}
                  onPress={handleUpdateAbout}
                >
                  {updateProfileMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Bio</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 3. DISCOVERY PREFERENCES */}
            {activeSheet === "discovery" && (
              <VStack space="lg" w="100%">
                <VStack>
                  <Text size="xl" fontWeight="$bold" color="$textLight900">
                    Discovery Preferences
                  </Text>
                  <Text size="sm" color="$textLight500">
                    Adjust your match preferences
                  </Text>
                </VStack>

                <VStack space="xs">
                  <Text size="md" color="$textLight900">
                    Age Range
                  </Text>
                  <Text size="xs" color="$textLight500">
                    Enter the age range you're interested in
                  </Text>
                  <HStack space="md" mt="$2" w="100%">
                    <VStack
                      flex={1}
                      bg="#F7F5F4"
                      borderWidth={1}
                      borderColor="#1A1A1A"
                      borderRadius="$xl"
                      h={65}
                      pl="$4"
                      justifyContent="center"
                    >
                      <Text size="xs" color="$textLight500">
                        From
                      </Text>
                      <Input h={24} p={0} borderWidth={0}>
                        <InputField
                          p={0}
                          value={minAge}
                          onChangeText={setMinAge}
                          fontWeight="$bold"
                          size="md"
                          keyboardType="numeric"
                        />
                      </Input>
                    </VStack>
                    <VStack
                      flex={1}
                      bg="#F7F5F4"
                      borderWidth={1}
                      borderColor="#1A1A1A"
                      borderRadius="$xl"
                      h={65}
                      pl="$4"
                      justifyContent="center"
                    >
                      <Text size="xs" color="$textLight500">
                        To
                      </Text>
                      <Input h={24} p={0} borderWidth={0}>
                        <InputField
                          p={0}
                          value={maxAge}
                          onChangeText={setMaxAge}
                          fontWeight="$bold"
                          size="md"
                          keyboardType="numeric"
                        />
                      </Input>
                    </VStack>
                  </HStack>
                </VStack>

                <VStack space="xs">
                  <Text size="md" color="$textLight900">
                    Max Distance (km)
                  </Text>
                  <Text size="xs" color="$textLight500">
                    Set the maximum distance for matches
                  </Text>
                  <VStack
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
                    h={65}
                    pl="$4"
                    mt="$2"
                    justifyContent="center"
                  >
                    <Text size="xs" color="$textLight500">
                      Distance
                    </Text>
                    <Input h={24} p={0} borderWidth={0}>
                      <InputField
                        p={0}
                        value={maxDistance}
                        onChangeText={setMaxDistance}
                        fontWeight="$bold"
                        size="md"
                        keyboardType="numeric"
                      />
                    </Input>
                  </VStack>
                </VStack>

                <VStack space="xs">
                  <Text size="md" color="$textLight900">
                    Looking For
                  </Text>
                  <Text size="xs" color="$textLight500">
                    Select what you're looking for in a match
                  </Text>
                  <VStack space="md" mt="$3">
                    {LOOKING_FOR_OPTIONS.map((opt) => {
                      const isChecked = lookingFor.includes(opt);
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => toggleLookingFor(opt)}
                        >
                          <HStack alignItems="center" space="md">
                            <Box
                              w={24}
                              h={24}
                              borderRadius={6}
                              borderWidth={isChecked ? 0 : 1}
                              borderColor={
                                isChecked ? "transparent" : PRIMARY_COLOR
                              }
                              bg={isChecked ? PRIMARY_COLOR : "transparent"}
                              justifyContent="center"
                              alignItems="center"
                            >
                              {isChecked && (
                                <MaterialIcons
                                  name="check"
                                  size={16}
                                  color="#FFFFFF"
                                />
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

                <VStack space="xs">
                  <Text size="md" color="$textLight900">
                    Children
                  </Text>
                  <Text size="xs" color="$textLight500">
                    Indicate your preference regarding children
                  </Text>
                  <VStack
                    bg="#F7F5F4"
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
                    h={65}
                    pl="$4"
                    mt="$2"
                    justifyContent="center"
                  >
                    <Text size="xs" color="$textLight500">
                      Children Preference
                    </Text>
                    <Input h={24} p={0} borderWidth={0}>
                      <InputField
                        p={0}
                        value={childrenPref}
                        onChangeText={setChildrenPref}
                        fontWeight="$bold"
                        size="md"
                      />
                    </Input>
                  </VStack>
                </VStack>

                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$4"
                  disabled={updatePrefsMutation.isPending}
                  onPress={handleUpdateDiscovery}
                >
                  {updatePrefsMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Preferences</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 4. PRIVACY */}
            {activeSheet === "privacy" && (
              <VStack space="xl" w="100%">
                <VStack>
                  <Text size="xl" fontWeight="$bold" color="$textLight900">
                    Privacy Settings
                  </Text>
                  <Text size="sm" color="$textLight500">
                    Control what people see
                  </Text>
                </VStack>
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack>
                    <Text size="md" color="$textLight900">
                      Show Age
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Display your age on your profile
                    </Text>
                  </VStack>
                  <Switch
                    value={showAge}
                    onValueChange={setShowAge}
                    trackColor={{ false: "#E5E5E5", true: PRIMARY_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </HStack>
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack>
                    <Text size="md" color="$textLight900">
                      Show Distance
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Display distance on your profile
                    </Text>
                  </VStack>
                  <Switch
                    value={showDistance}
                    onValueChange={setShowDistance}
                    trackColor={{ false: "#E5E5E5", true: PRIMARY_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </HStack>
              </VStack>
            )}

            <Button
              size="xl"
              mt="$8"
              variant="outline"
              borderColor="#1A1A1A"
              borderRadius="$full"
              onPress={closeSheet}
            >
              <ButtonText fontWeight="$bold" color="#1A1A1A">
                Close
              </ButtonText>
            </Button>
          </ScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </SafeAreaView>
  );
}
