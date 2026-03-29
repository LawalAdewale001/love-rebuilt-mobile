import { IconSymbol } from "@/components/ui/icon-symbol";
import { clearAuth } from "@/lib/auth-store";
import { queryClient } from "@/lib/query-client";
import { disconnectSocket } from "@/lib/socket";
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    Box,
    Button,
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
import { useRouter } from "expo-router";
import { useState } from "react";
import { Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define the different types of edit sheets
type EditSheetType =
  | "editProfile"
  | "aboutMe"
  | "interests"
  | "moreAboutMe"
  | "relationshipGoals"
  | "childrenStatus"
  | "location"
  | "discovery"
  | "privacy"
  | "blockedUsers" // Added new type
  | null;

// Mock data for blocked users
const BLOCKED_USERS = [
  {
    id: 1,
    name: "Anike",
    age: 27,
    avatar: require("@/assets/images/react-logo.png"),
  },
  {
    id: 2,
    name: "Blessing",
    age: 34,
    avatar: require("@/assets/images/react-logo.png"),
  },
  {
    id: 3,
    name: "Princess",
    age: 29,
    avatar: require("@/assets/images/react-logo.png"),
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<EditSheetType>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    disconnectSocket();
    await clearAuth();
    queryClient.clear();
    router.replace("/(auth)/sign-in");
  };

  // Mock States for the forms
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [bio, setBio] = useState(
    "Passionate about design, coffee, and exploring new places. Love long walks, good conversations, and spontaneous adventures. Looking for someone to share life's beautiful moments with.",
  );

  // Helper to render the list items on the main profile screen
  const ProfileListItem = ({
    title,
    value,
    sheet,
  }: {
    title: string;
    value?: string;
    sheet: EditSheetType;
  }) => (
    <Pressable onPress={() => setActiveSheet(sheet)} py="$4">
      <HStack justifyContent="space-between" alignItems="center">
        <VStack space="xs" flex={1} pr="$4">
          <Text size="md" fontWeight="$medium" color="$textLight900">
            {title}
          </Text>
          {value && (
            <Text size="sm" color="$textLight500" numberOfLines={1}>
              {value}
            </Text>
          )}
        </VStack>
        <IconSymbol name="chevron.right" size={20} color="#1A1A1A" />
      </HStack>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box px="$6" py="$4" alignItems="center">
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Profile
        </Text>
      </Box>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack px="$6" pb="$10" space="lg">
          {/* User Avatar & Basic Info */}
          <VStack alignItems="center" space="md" mt="$4" mb="$6">
            <Box
              w={100}
              h={100}
              borderRadius="$full"
              overflow="hidden"
              position="relative"
            >
              <Image
                source={require("@/assets/images/react-logo.png")} // Replace with User Avatar
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </Box>
            <VStack alignItems="center">
              <Text size="xl" fontWeight="$bold" color="$textLight900">
                Abiodun Abayomi, 28
              </Text>
              <Text size="sm" color="$textLight500">
                Lagos, Nigeria
              </Text>
            </VStack>
          </VStack>

          {/* Profile Sections */}
          <VStack
            bg="#FFF9FA"
            borderRadius="$2xl"
            px="$4"
            py="$2"
            borderWidth={1}
            borderColor="$borderLight100"
          >
            <ProfileListItem
              title="Edit Profile"
              value="Name, Age"
              sheet="editProfile"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem title="About Me" value={bio} sheet="aboutMe" />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Interests"
              value="Singing, Anime Fan, Dancing..."
              sheet="interests"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="More About Me"
              value="Christian, Yoruba, 2 Children"
              sheet="moreAboutMe"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Relationship Goals"
              value="Have a Serious Relationship"
              sheet="relationshipGoals"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Children Status"
              value="No, I don't have children"
              sheet="childrenStatus"
            />
          </VStack>

          <Text size="lg" fontWeight="$bold" color="$textLight900" mt="$4">
            Settings
          </Text>

          <VStack
            bg="#FFF9FA"
            borderRadius="$2xl"
            px="$4"
            py="$2"
            borderWidth={1}
            borderColor="$borderLight100"
          >
            <ProfileListItem title="Location" value="Lagos" sheet="location" />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Discovery Preferences"
              value="Age, Distance, Looking for"
              sheet="discovery"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Privacy Settings"
              value="Control what people see"
              sheet="privacy"
            />
            <Divider bg="$borderLight200" />
            <ProfileListItem
              title="Blocked Users"
              value="Manage blocked accounts"
              sheet="blockedUsers"
            />
          </VStack>

          {/* Logout Button */}
          <Button
            size="xl"
            variant="outline"
            borderColor="#E86673"
            borderRadius="$full"
            mt="$6"
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <ButtonText fontWeight="$bold" color="#E86673">
              {loggingOut ? "Logging out..." : "Log Out"}
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>

      {/* DYNAMIC ACTION SHEET */}
      <Actionsheet
        isOpen={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        snapPoints={[80]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent
          bg="#FFFFFF"
          borderTopLeftRadius="$3xl"
          borderTopRightRadius="$3xl"
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator bg="$backgroundLight400" w="$16" />
          </ActionsheetDragIndicatorWrapper>

          <ScrollView
            w="100%"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <VStack w="100%" px="$6" pt="$4" space="xl">
              {/* DYNAMIC CONTENT: BLOCKED USERS */}
              {activeSheet === "blockedUsers" && (
                <>
                  <VStack space="xs" mb="$2">
                    <Text size="xl" fontWeight="$bold" color="$textLight900">
                      Blocked Users
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Manage blocked accounts
                    </Text>
                  </VStack>
                  <VStack space="lg" mt="$2">
                    {BLOCKED_USERS.map((user) => (
                      <HStack
                        key={user.id}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <HStack space="md" alignItems="center">
                          <Box
                            w={48}
                            h={48}
                            borderRadius="$full"
                            overflow="hidden"
                          >
                            <Image
                              source={user.avatar}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          </Box>
                          <VStack>
                            <Text
                              size="md"
                              fontWeight="$bold"
                              color="$textLight900"
                            >
                              {user.name}
                            </Text>
                            <Text size="sm" color="$textLight500">
                              {user.age} Years Old
                            </Text>
                          </VStack>
                        </HStack>
                        <Pressable
                          onPress={() => console.log("Unblock", user.name)}
                        >
                          <Text color="#E86673" fontWeight="$bold">
                            Unblock
                          </Text>
                        </Pressable>
                      </HStack>
                    ))}
                  </VStack>
                </>
              )}

              {/* DYNAMIC CONTENT: PRIVACY SETTINGS */}
              {activeSheet === "privacy" && (
                <>
                  <VStack space="xs" mb="$4">
                    <Text size="xl" fontWeight="$bold" color="$textLight900">
                      Privacy Settings
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Control what people see
                    </Text>
                  </VStack>
                  <HStack justifyContent="space-between" alignItems="center">
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
                      trackColor={{ false: "#E5E5E5", true: "#E86673" }}
                    />
                  </HStack>
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    mt="$4"
                  >
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
                      trackColor={{ false: "#E5E5E5", true: "#E86673" }}
                    />
                  </HStack>
                </>
              )}

              {/* DYNAMIC CONTENT: ABOUT ME */}
              {activeSheet === "aboutMe" && (
                <>
                  <VStack space="xs" mb="$4">
                    <Text size="xl" fontWeight="$bold" color="$textLight900">
                      About Me
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Makes changes to your bio
                    </Text>
                  </VStack>
                  <Box
                    borderWidth={1}
                    borderColor="#1A1A1A"
                    borderRadius="$xl"
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
                        left={12}
                        size="xs"
                        color="$textLight500"
                        zIndex={10}
                      >
                        About Me
                      </Text>
                      <TextareaInput
                        value={bio}
                        onChangeText={setBio}
                        pt="$8"
                        px="$3"
                        color="$textLight900"
                        fontWeight="$medium"
                      />
                    </Textarea>
                  </Box>
                </>
              )}

              {/* DYNAMIC CONTENT: EDIT PROFILE */}
              {activeSheet === "editProfile" && (
                <>
                  <VStack space="xs" mb="$4">
                    <Text size="xl" fontWeight="$bold" color="$textLight900">
                      Edit Profile
                    </Text>
                    <Text size="sm" color="$textLight500">
                      Change your name and age
                    </Text>
                  </VStack>
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
                        value="Abiodun Abayomi"
                        fontWeight="$bold"
                        size="md"
                      />
                    </VStack>
                  </Input>
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
                            Day
                          </Text>
                          <InputField
                            p={0}
                            h={24}
                            value="07"
                            fontWeight="$bold"
                            size="md"
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
                            Month
                          </Text>
                          <InputField
                            p={0}
                            h={24}
                            value="06"
                            fontWeight="$bold"
                            size="md"
                          />
                        </VStack>
                      </Input>
                    </Box>
                    <Box flex={1.2}>
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
                            Year
                          </Text>
                          <InputField
                            p={0}
                            h={24}
                            value="1907"
                            fontWeight="$bold"
                            size="md"
                          />
                        </VStack>
                      </Input>
                    </Box>
                  </HStack>
                </>
              )}

              {/* Universal Save/Cancel Buttons */}
              <VStack space="md" mt="$8">
                {/* Hide the Save button if we are looking at Privacy Settings or Blocked Users */}
                {activeSheet !== "privacy" &&
                  activeSheet !== "blockedUsers" && (
                    <Button
                      w="100%"
                      size="xl"
                      bg="#F4F3F2"
                      borderRadius="$full"
                      onPress={() => setActiveSheet(null)}
                    >
                      <ButtonText fontWeight="$bold" color="#D0D0D0">
                        Save
                      </ButtonText>
                    </Button>
                  )}
                <Button
                  w="100%"
                  size="xl"
                  variant="outline"
                  borderColor="#1A1A1A"
                  borderRadius="$full"
                  onPress={() => setActiveSheet(null)}
                >
                  <ButtonText fontWeight="$bold" color="#1A1A1A">
                    Cancel
                  </ButtonText>
                </Button>
              </VStack>
            </VStack>
          </ScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </SafeAreaView>
  );
}
