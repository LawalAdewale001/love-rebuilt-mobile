import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import { useS3Upload } from "@/hooks/use-s3-upload";
import { useProfileQuery, useUpdateProfileMutation } from "@/lib/queries";
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
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Spinner,
  Switch,
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const BOX_SIZE = (width - 48 - 16) / 3;

// Placeholder lists for multi-selects (Update these with your real taxonomy if needed!)
const AVAILABLE_INTERESTS = [
  "Anime Fan",
  "Chocolate Fan",
  "Singing",
  "Foodie",
  "Dancing",
  "Travel",
  "Techie",
  "Artist",
  "Plantain Lover",
  "Chef",
  "Fitness",
  "Movies",
];
const GOALS = [
  "Long-term relationship",
  "New friends",
  "A Wife",
  "Casual Dating",
  "Not sure yet",
];

// --- Reusable Components ---
const TagPill = ({ text }: { text: string }) => (
  <Box bg="#F7F5F4" px="$4" py="$2" borderRadius="$full">
    <Text size="sm" color="$textLight900" fontWeight="$medium">
      {text}
    </Text>
  </Box>
);

const ProfileSection = ({ title, children, onEdit }: any) => (
  <VStack space="sm" mt="$2">
    <HStack justifyContent="space-between" alignItems="center">
      <Text size="lg" fontWeight="$bold" color="$textLight900">
        {title}
      </Text>
      {onEdit && (
        <Pressable onPress={onEdit} p="$2" m="-$2">
          <MaterialIcons name="edit" size={18} color={PRIMARY_COLOR} />
        </Pressable>
      )}
    </HStack>
    {children}
  </VStack>
);

export default function ProfileScreen() {
  const router = useRouter();

  const updateMutation = useUpdateProfileMutation();
  const { upload } = useS3Upload();

  const { data: profile, isLoading, error } = useProfileQuery();

  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  // --- Direct Edit Modal States ---
  const [activeSheet, setActiveSheet] = useState<
    "about" | "interests" | "more" | "goals" | "children" | null
  >(null);

  // Form States
  const [editBio, setEditBio] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editIdentity, setEditIdentity] = useState("");
  const [editReligion, setEditReligion] = useState("");
  const [editTribe, setEditTribe] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editHasChildren, setEditHasChildren] = useState(false);
  const [editChildrenCount, setEditChildrenCount] = useState("");
  const [editChildrenStay, setEditChildrenStay] = useState("");

  // Sync profile data to edit forms when a sheet opens
  useEffect(() => {
    if (profile && activeSheet) {
      setEditBio(profile.bio || "");
      setEditInterests(profile.interests || []);
      setEditIdentity(profile.identity || "");
      setEditReligion(profile.religion || "");
      setEditTribe(profile.tribe || "");
      setEditGoal(profile.relationshipGoal || "");
      setEditHasChildren(profile.hasChildren || false);
      setEditChildrenCount(profile.childrenCount?.toString() || "");
      setEditChildrenStay(profile.childrenStay || "");
    }
  }, [profile, activeSheet]);

  // Sync Gallery
  useEffect(() => {
    if (profile?.pictures) setGalleryImages(profile.pictures);
  }, [profile?.pictures]);

  // --- Handlers ---
  const closeSheet = () => setActiveSheet(null);

  const handleDirectSave = (payload: any) => {
    updateMutation.mutate(payload, {
      onSuccess: () => {
        showToast("success", "Saved", "Profile section updated.");
        closeSheet();
      },
      onError: (err: any) =>
        showToast(
          "error",
          "Error",
          err?.message || "Failed to update profile.",
        ),
    });
  };

  const toggleInterest = (interest: string) => {
    setEditInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const pickImage = async () => {
    if (galleryImages.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const localUri = result.assets[0].uri;
      setGalleryImages([...galleryImages, localUri]);

      try {
        const fileName = `gallery_${Date.now()}.jpg`;
        const uploadResult = await upload(localUri, fileName, "image/jpeg");
        if (uploadResult?.fileUrl) {
          const updatedPictures = [
            ...(profile?.pictures || []),
            uploadResult.fileUrl,
          ];
          updateMutation.mutate({ pictures: updatedPictures });
        }
      } catch (err) {
        showToast("error", "Upload Failed", "Could not save image to profile.");
        setGalleryImages(profile?.pictures || []);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = galleryImages.filter(
      (_, index) => index !== indexToRemove,
    );
    setGalleryImages(updatedImages);
    if (
      typeof galleryImages[indexToRemove] === "string" &&
      galleryImages[indexToRemove].startsWith("http")
    ) {
      updateMutation.mutate({ pictures: updatedImages });
    }
  };

  if (isLoading) {
    return (
      <Box flex={1} bg="#FFFFFF" justifyContent="center" alignItems="center">
        <Spinner size="large" color={PRIMARY_COLOR} />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box flex={1} bg="#FFFFFF" justifyContent="center" alignItems="center">
        <Text color="$textLight500">
          Failed to load profile. Pull to refresh.
        </Text>
      </Box>
    );
  }

  const slots = Array.from({ length: 6 }).map(
    (_, i) => galleryImages[i] || null,
  );
  const topTags = profile.interests?.slice(0, 2) || [];
  if (profile.interests && profile.interests.length > 2)
    topTags.push(`+${profile.interests.length - 2}`);

  return (
    <Box flex={1} bg="#FFFFFF">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Main Scroll Content */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false} bounces={false}>
        {/* --- HERO IMAGE SECTION --- */}
        <Box h={450} w="100%" position="relative">
          <Image
            source={{
              uri:
                profile.avatar ||
                profile.pictures?.[0] ||
                "https://via.placeholder.com/400",
            }}
            style={{ width: "100%", height: "100%", position: "absolute" }}
            contentFit="cover"
          />
          <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 10, right: 24, zIndex: 10 }}
          >
            {/* ONLY this gear goes to settings! */}
            <Pressable
              w={40}
              h={40}
              bg={PRIMARY_COLOR}
              borderRadius="$full"
              justifyContent="center"
              alignItems="center"
              onPress={() => router.push("/settings")}
            >
              <MaterialIcons name="settings" size={20} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h={200}
            bg="$black"
            opacity={0.6}
            zIndex={5}
          />
          <VStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            pb="$6"
            px="$6"
            zIndex={10}
          >
            <HStack space="xs" alignItems="center" mb="$2">
              <Image
                source={require("@/assets/images/icon-location.png")}
                style={{ width: 16, height: 16 }}
                contentFit="contain"
                tintColor="#FFFFFF"
              />
              <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                {profile.location || "Location not set"}
              </Text>
            </HStack>
            <HStack space="xs" alignItems="center" mb="$3">
              <Text color="#FFFFFF" size="3xl" fontWeight="$bold">
                {profile.fullName?.split(" ")[0]}{" "}
                {profile.age > 0 ? `, ${profile.age}` : ""}
              </Text>
              {profile.isVerified && (
                <Image
                  source={require("@/assets/images/icon-verified.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
              )}
            </HStack>
            <HStack space="sm" flexWrap="wrap">
              {topTags.map((tag: string, idx: number) => (
                <Box
                  key={idx}
                  bg="rgba(255,255,255,0.3)"
                  px="$3"
                  py="$1.5"
                  borderRadius="$full"
                >
                  <Text color="#FFFFFF" size="xs" fontWeight="$semibold">
                    {tag}
                  </Text>
                </Box>
              ))}
            </HStack>
          </VStack>
        </Box>

        {/* --- BODY CONTENT --- */}
        <VStack
          px="$4"
          py="$6"
          space="2xl"
          bg="#FFFFFF"
          borderTopLeftRadius={20}
          borderTopRightRadius={20}
          mt={-20}
          zIndex={20}
        >
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              Gallery
            </Text>
            <HStack flexWrap="wrap" gap={8}>
              {slots.map((imageUri, index) => (
                <Box
                  key={index}
                  width={BOX_SIZE}
                  height={BOX_SIZE}
                  borderRadius="$md"
                  overflow="hidden"
                  position="relative"
                >
                  {imageUri ? (
                    <>
                      <Image
                        source={{
                          uri:
                            typeof imageUri === "string"
                              ? imageUri
                              : imageUri.uri,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <Pressable
                        position="absolute"
                        top={4}
                        right={4}
                        w={24}
                        h={24}
                        bg={PRIMARY_COLOR}
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        onPress={() => removeImage(index)}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={14}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      flex={1}
                      borderRadius="$md"
                      borderWidth={1}
                      borderStyle="dashed"
                      borderColor={PRIMARY_COLOR}
                      bg="#FFF9FA"
                      justifyContent="center"
                      alignItems="center"
                      onPress={pickImage}
                    >
                      <MaterialIcons
                        name="add-photo-alternate"
                        size={28}
                        color={PRIMARY_COLOR}
                      />
                    </Pressable>
                  )}
                </Box>
              ))}
            </HStack>
          </VStack>

          <HStack justifyContent="space-between" space="md">
            <VStack
              flex={1}
              bg="#F7F5F4"
              borderRadius="$xl"
              py="$4"
              alignItems="center"
            >
              <Text size="xl" fontWeight="$bold" color="$textLight900">
                24
              </Text>
              <Text size="xs" color="$textLight500" mt="$1">
                Matches
              </Text>
            </VStack>
            <VStack
              flex={1}
              bg="#F7F5F4"
              borderRadius="$xl"
              py="$4"
              alignItems="center"
            >
              <Text size="xl" fontWeight="$bold" color="$textLight900">
                156
              </Text>
              <Text size="xs" color="$textLight500" mt="$1">
                Likes
              </Text>
            </VStack>
            <VStack
              flex={1}
              bg="#F7F5F4"
              borderRadius="$xl"
              py="$4"
              alignItems="center"
            >
              <Text size="xl" fontWeight="$bold" color="$textLight900">
                89%
              </Text>
              <Text size="xs" color="$textLight500" mt="$1">
                Match Rate
              </Text>
            </VStack>
          </HStack>

          {/* ActionSheet Triggers */}
          <ProfileSection
            title="About Me"
            onEdit={() => setActiveSheet("about")}
          >
            <Text size="md" color="$textLight500" lineHeight="$md">
              {profile.bio || "Tap the pencil to add a bio!"}
            </Text>
          </ProfileSection>

          <ProfileSection
            title="Interests"
            onEdit={() => setActiveSheet("interests")}
          >
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((item: string) => (
                  <TagPill key={item} text={item} />
                ))
              ) : (
                <Text size="sm" color="$textLight500">
                  Add your interests
                </Text>
              )}
            </HStack>
          </ProfileSection>

          <ProfileSection
            title="More About Me"
            onEdit={() => setActiveSheet("more")}
          >
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {profile.identity && <TagPill text={profile.identity} />}
              {profile.religion && <TagPill text={profile.religion} />}
              {profile.tribe && <TagPill text={profile.tribe} />}
              {!profile.identity && !profile.religion && !profile.tribe && (
                <Text size="sm" color="$textLight500">
                  Add more details
                </Text>
              )}
            </HStack>
          </ProfileSection>

          <ProfileSection
            title="Relationship Goals"
            onEdit={() => setActiveSheet("goals")}
          >
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {profile.relationshipGoal ? (
                <TagPill text={profile.relationshipGoal} />
              ) : (
                <Text size="sm" color="$textLight500">
                  What are you looking for?
                </Text>
              )}
            </HStack>
          </ProfileSection>

          <ProfileSection
            title="Children Status"
            onEdit={() => setActiveSheet("children")}
          >
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {profile.hasChildren !== undefined ? (
                profile.hasChildren ? (
                  <>
                    <TagPill
                      text={`Has ${profile.childrenCount || ""} Children`}
                    />
                    {profile.childrenStay && (
                      <TagPill text={`Lives ${profile.childrenStay}`} />
                    )}
                  </>
                ) : (
                  <TagPill text="No Children" />
                )
              ) : (
                <Text size="sm" color="$textLight500">
                  Add children status
                </Text>
              )}
            </HStack>
          </ProfileSection>

          {/* Spacer for bottom nav */}
          <Box h={40} />
        </VStack>
      </ScrollView>

      {/* --- INLINE EDITING ACTIONSHEETS --- */}
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
            {/* 1. Edit Bio */}
            {activeSheet === "about" && (
              <VStack space="lg" w="100%">
                <Text size="xl" fontWeight="$bold" color="$textLight900">
                  About Me
                </Text>
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
                    <TextareaInput
                      pt="$4"
                      px="$4"
                      color="$textLight900"
                      fontWeight="$medium"
                      value={editBio}
                      onChangeText={setEditBio}
                      placeholder="Write something about yourself..."
                    />
                  </Textarea>
                </Box>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$4"
                  disabled={updateMutation.isPending}
                  onPress={() => handleDirectSave({ bio: editBio.trim() })}
                >
                  {updateMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 2. Edit Interests */}
            {activeSheet === "interests" && (
              <VStack space="lg" w="100%">
                <Text size="xl" fontWeight="$bold" color="$textLight900">
                  Your Interests
                </Text>
                <HStack flexWrap="wrap" gap={8} mt="$2">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = editInterests.includes(interest);
                    return (
                      <Pressable
                        key={interest}
                        onPress={() => toggleInterest(interest)}
                        bg={isSelected ? PRIMARY_COLOR : "#F7F5F4"}
                        px="$4"
                        py="$2"
                        borderRadius="$full"
                      >
                        <Text
                          color={isSelected ? "#FFFFFF" : "$textLight900"}
                          fontWeight="$medium"
                        >
                          {interest}
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$8"
                  disabled={updateMutation.isPending}
                  onPress={() => handleDirectSave({ interests: editInterests })}
                >
                  {updateMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Interests</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 3. Edit More About Me */}
            {activeSheet === "more" && (
              <VStack space="lg" w="100%">
                <Text size="xl" fontWeight="$bold" color="$textLight900">
                  More Details
                </Text>
                <VStack
                  bg="#F7F5F4"
                  borderWidth={1}
                  borderColor="#1A1A1A"
                  borderRadius="$xl"
                  h={65}
                  pl="$4"
                  justifyContent="center"
                >
                  <Text size="xs" color="$textLight500">
                    Identity
                  </Text>
                  <Input variant="unstyled" h={24} p={0}>
                    <InputField
                      p={0}
                      value={editIdentity}
                      onChangeText={setEditIdentity}
                      fontWeight="$bold"
                      size="md"
                      placeholder="E.g. Introvert"
                    />
                  </Input>
                </VStack>
                <VStack
                  bg="#F7F5F4"
                  borderWidth={1}
                  borderColor="#1A1A1A"
                  borderRadius="$xl"
                  h={65}
                  pl="$4"
                  justifyContent="center"
                >
                  <Text size="xs" color="$textLight500">
                    Religion
                  </Text>
                  <Input variant="unstyled" h={24} p={0}>
                    <InputField
                      p={0}
                      value={editReligion}
                      onChangeText={setEditReligion}
                      fontWeight="$bold"
                      size="md"
                      placeholder="E.g. Christian"
                    />
                  </Input>
                </VStack>
                <VStack
                  bg="#F7F5F4"
                  borderWidth={1}
                  borderColor="#1A1A1A"
                  borderRadius="$xl"
                  h={65}
                  pl="$4"
                  justifyContent="center"
                >
                  <Text size="xs" color="$textLight500">
                    Tribe
                  </Text>
                  <Input variant="unstyled" h={24} p={0}>
                    <InputField
                      p={0}
                      value={editTribe}
                      onChangeText={setEditTribe}
                      fontWeight="$bold"
                      size="md"
                      placeholder="E.g. Yoruba"
                    />
                  </Input>
                </VStack>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$4"
                  disabled={updateMutation.isPending}
                  onPress={() =>
                    handleDirectSave({
                      identity: editIdentity,
                      religion: editReligion,
                      tribe: editTribe,
                    })
                  }
                >
                  {updateMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Details</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 4. Edit Goals */}
            {activeSheet === "goals" && (
              <VStack space="lg" w="100%">
                <Text size="xl" fontWeight="$bold" color="$textLight900">
                  Relationship Goal
                </Text>
                <VStack space="md" mt="$2">
                  {GOALS.map((goal) => (
                    <Pressable key={goal} onPress={() => setEditGoal(goal)}>
                      <HStack alignItems="center" space="md">
                        <Box
                          w={24}
                          h={24}
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={
                            editGoal === goal
                              ? PRIMARY_COLOR
                              : "$borderLight400"
                          }
                          justifyContent="center"
                          alignItems="center"
                        >
                          {editGoal === goal && (
                            <Box
                              w={12}
                              h={12}
                              borderRadius={6}
                              bg={PRIMARY_COLOR}
                            />
                          )}
                        </Box>
                        <Text size="md" color="$textLight900">
                          {goal}
                        </Text>
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$8"
                  disabled={updateMutation.isPending}
                  onPress={() =>
                    handleDirectSave({ relationshipGoal: editGoal })
                  }
                >
                  {updateMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Goal</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            {/* 5. Edit Children Status */}
            {activeSheet === "children" && (
              <VStack space="lg" w="100%">
                <Text size="xl" fontWeight="$bold" color="$textLight900">
                  Children Status
                </Text>

                <HStack
                  alignItems="center"
                  justifyContent="space-between"
                  py="$2"
                >
                  <VStack>
                    <Text size="md" color="$textLight900">
                      Do you have children?
                    </Text>
                  </VStack>
                  <Switch
                    value={editHasChildren}
                    onValueChange={setEditHasChildren}
                    trackColor={{ false: "#E5E5E5", true: PRIMARY_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </HStack>

                {editHasChildren && (
                  <>
                    <VStack
                      bg="#F7F5F4"
                      borderWidth={1}
                      borderColor="#1A1A1A"
                      borderRadius="$xl"
                      h={65}
                      pl="$4"
                      justifyContent="center"
                    >
                      <Text size="xs" color="$textLight500">
                        How many children?
                      </Text>
                      <Input variant="unstyled" h={24} p={0}>
                        <InputField
                          p={0}
                          value={editChildrenCount}
                          onChangeText={setEditChildrenCount}
                          fontWeight="$bold"
                          size="md"
                          keyboardType="numeric"
                          placeholder="E.g. 2"
                        />
                      </Input>
                    </VStack>
                    <VStack
                      bg="#F7F5F4"
                      borderWidth={1}
                      borderColor="#1A1A1A"
                      borderRadius="$xl"
                      h={65}
                      pl="$4"
                      justifyContent="center"
                    >
                      <Text size="xs" color="$textLight500">
                        Where do they live?
                      </Text>
                      <Input variant="unstyled" h={24} p={0}>
                        <InputField
                          p={0}
                          value={editChildrenStay}
                          onChangeText={setEditChildrenStay}
                          fontWeight="$bold"
                          size="md"
                          placeholder="E.g. With me"
                        />
                      </Input>
                    </VStack>
                  </>
                )}

                <Button
                  size="xl"
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  mt="$6"
                  disabled={updateMutation.isPending}
                  onPress={() =>
                    handleDirectSave({
                      hasChildren: editHasChildren,
                      childrenCount: parseInt(editChildrenCount) || 0,
                      childrenStay: editChildrenStay,
                    })
                  }
                >
                  {updateMutation.isPending ? (
                    <ButtonSpinner color="#FFFFFF" />
                  ) : (
                    <ButtonText fontWeight="$bold">Save Status</ButtonText>
                  )}
                </Button>
              </VStack>
            )}

            <Button
              size="xl"
              mt="$4"
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
    </Box>
  );
}
