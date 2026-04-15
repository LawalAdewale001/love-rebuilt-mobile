import { OnboardingHeader } from "@/components/ui/onboarding-header";
import { showToast } from "@/components/ui/toast";
import { useS3Upload } from "@/hooks/use-s3-upload";
import { useUpdateProfileMutation } from "@/lib/queries";
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
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
import { useState } from "react";
import { Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const BOX_SIZE = (width - 48 - 16) / 3;

export default function GalleryScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { upload } = useS3Upload();
  const updateMutation = useUpdateProfileMutation();

  const pickImage = async () => {
    if (images.length >= 6) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("We need camera roll permissions to add your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const isComplete = images.length > 0 && bio.trim().length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const uploadedUrls: string[] = [];

      for (const uri of images) {
        const filename = uri.split("/").pop() || `photo-${Date.now()}.jpg`;
        const result = await upload(uri, filename, "image/jpeg");

        if (result?.fileUrl) {
          uploadedUrls.push(result.fileUrl);
        } else {
          throw new Error("One or more images failed to upload");
        }
      }

      // Payload directly maps to your schema: { bio: "string", pictures: ["string"] }
      updateMutation.mutate({ pictures: uploadedUrls, bio } as any, {
        onSuccess: () => {
          showToast("success", "Profile Complete", "Welcome aboard!");
          router.replace("/(tabs)");
        },
        onError: (err: any) => {
          showToast("error", "Error", err?.message || "Failed to save profile");
          setIsSubmitting(false);
        },
      });
    } catch (error: any) {
      showToast("error", "Upload Error", error.message);
      setIsSubmitting(false);
    }
  };

  const slots = Array.from({ length: 6 }).map((_, i) => images[i] || null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={100} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <VStack flex={1} px="$6" pt="$6">
          <Text size="2xl" fontWeight="$bold" color="$textLight900">
            Add your Gallery and Bio
          </Text>
          <Text size="md" color="$textLight600" mt="$1">
            Add your pictures and bio
          </Text>

          <ScrollView
            flex={1}
            showsVerticalScrollIndicator={false}
            mt="$6"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <HStack flexWrap="wrap" gap={8} mb="$8">
              {slots.map((imageUri, index) => (
                <Box key={index} width={BOX_SIZE} height={BOX_SIZE}>
                  {imageUri ? (
                    <Box
                      flex={1}
                      borderRadius="$md"
                      overflow="hidden"
                      position="relative"
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <Pressable
                        position="absolute"
                        top={4}
                        right={4}
                        w={24}
                        h={24}
                        bg="#E86673"
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </Pressable>
                    </Box>
                  ) : (
                    <Pressable
                      flex={1}
                      borderRadius="$md"
                      borderWidth={1}
                      borderStyle="dashed"
                      borderColor="#E86673"
                      bg="#FFF9FA"
                      justifyContent="center"
                      alignItems="center"
                      onPress={pickImage}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={32}
                        color="#E86673"
                      />
                    </Pressable>
                  )}
                </Box>
              ))}
            </HStack>

            <Box
              borderWidth={1}
              borderColor="#E0E0E0"
              borderRadius="$2xl"
              bg="#F9F9F9"
              overflow="hidden"
            >
              <Textarea
                size="md"
                w="100%"
                h={150}
                borderWidth={0}
                bg="transparent"
              >
                <Text
                  position="absolute"
                  top={10}
                  left={12}
                  size="xs"
                  color="$textLight500"
                  zIndex={10}
                >
                  Write your bio
                </Text>
                <TextareaInput
                  placeholder=""
                  value={bio}
                  onChangeText={setBio}
                  pt="$8"
                  px="$3"
                  color="$textLight900"
                  fontWeight="$medium"
                />
              </Textarea>
            </Box>
          </ScrollView>

          <Box pb="$8" pt="$4" bg="$white">
            <Button
              w="100%"
              size="xl"
              bg={isComplete ? "#E86673" : "#F4F3F2"}
              borderRadius="$full"
              disabled={!isComplete || isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ButtonSpinner color="#FFFFFF" />
              ) : (
                <ButtonText
                  fontWeight="$bold"
                  color={isComplete ? "#FFFFFF" : "$textLight400"}
                >
                  Submit
                </ButtonText>
              )}
            </Button>
          </Box>
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
