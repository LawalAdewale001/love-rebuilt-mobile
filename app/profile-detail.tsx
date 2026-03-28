import {
    Box,
    Button,
    ButtonText,
    HStack,
    Pressable,
    ScrollView,
    Text,
    VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data structure for clean JSX rendering
const PROFILE = {
  name: "Patricia",
  age: 26,
  verified: true,
  location: "Lagos, Nigeria",
  status: "Open to Dating",
  topTags: ["Anime Fan", "Chocolate Fan", "+5"],
  about: "Confident, easygoing, enjoys meeting new people and meaning people",
  interests: ["Singing", "Anime Fan", "Foodie", "Dancing"],
  moreAboutMe: ["Christian", "Yoruba", "Mother of Two"],
  relationshipGoals: ["Have a Serious Relationship", "Get Married"],
  childrenStatus: ["2 kids", "Live with me", "0–2 years (Infant/Toddler)"],
};

// Reusable component for the pill tags
const TagPill = ({ text }: { text: string }) => (
  <Box bg="#F7F5F4" px="$4" py="$2" borderRadius="$full">
    <Text size="sm" color="$textLight900" fontWeight="$medium">
      {text}
    </Text>
  </Box>
);

export default function ProfileDetailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Fixed Top Header */}
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
          <Text size="sm" color="#1A1A1A" fontWeight="bold">
            {"<"}
          </Text>
        </Pressable>
        <HStack alignItems="center" space="xs">
          <Text size="xl" fontWeight="$bold" color="$textLight900">
            {PROFILE.name}, {PROFILE.age}
          </Text>
          {PROFILE.verified && <Text size="lg">✅</Text>}
        </HStack>
      </Box>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack px="$6" pb="$10" pt="$2" space="2xl">
          {/* Hero Image Section */}
          <Box
            h={400}
            w="100%"
            borderRadius={30}
            overflow="hidden"
            position="relative"
          >
            <Image
              source={require("@/assets/images/react-logo.png")} // Replace with Patricia's image
              style={{ width: "100%", height: "100%", position: "absolute" }}
              contentFit="cover"
            />

            {/* Top Badge */}
            <Box
              position="absolute"
              top={16}
              left={16}
              bg="#FFFFFF"
              opacity={0.9}
              py="$2"
              px="$4"
              borderRadius="$full"
            >
              <HStack space="xs" alignItems="center">
                <Text>🖤</Text>
                <Text fontWeight="$semibold" size="sm" color="#1A1A1A">
                  {PROFILE.status}
                </Text>
              </HStack>
            </Box>

            {/* Bottom Info Gradient/Overlay */}
            <VStack
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              pt="$20"
              pb="$6"
              px="$6"
              bg="$black"
              opacity={0.6}
            />

            {/* Bottom Info Content */}
            <VStack
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              pb="$6"
              px="$6"
              zIndex={10}
            >
              <HStack space="xs" alignItems="center" mb="$1">
                <Text color="#FFFFFF" size="xs">
                  📍
                </Text>
                <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                  {PROFILE.location}
                </Text>
              </HStack>

              <HStack space="xs" alignItems="center" mb="$3">
                <Text color="#FFFFFF" size="2xl" fontWeight="$bold">
                  {PROFILE.name}, {PROFILE.age}
                </Text>
                {PROFILE.verified && <Text size="lg">✅</Text>}
              </HStack>

              <HStack
                space="md"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack space="sm" flexWrap="wrap" flex={1}>
                  {PROFILE.topTags.map((tag) => (
                    <Box
                      key={tag}
                      bg="rgba(255,255,255,0.3)"
                      px="$3"
                      py="$1.5"
                      borderRadius="$full"
                    >
                      <Text color="#FFFFFF" size="xs" fontWeight="$medium">
                        {tag}
                      </Text>
                    </Box>
                  ))}
                </HStack>
                <Pressable
                  w={56}
                  h={56}
                  bg="#E86673"
                  borderRadius="$full"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="#FFFFFF" size="xl">
                    ♥
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </Box>

          {/* About Me */}
          <VStack space="xs">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              About Me
            </Text>
            <Text size="md" color="$textLight500" lineHeight="$md">
              {PROFILE.about}
            </Text>
          </VStack>

          {/* Interests */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              Interests
            </Text>
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {PROFILE.interests.map((item) => (
                <TagPill key={item} text={item} />
              ))}
            </HStack>
          </VStack>

          {/* More About Me */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              More About Me
            </Text>
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {PROFILE.moreAboutMe.map((item) => (
                <TagPill key={item} text={item} />
              ))}
            </HStack>
          </VStack>

          {/* Relationship Goals */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              Relationship Goals
            </Text>
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {PROFILE.relationshipGoals.map((item) => (
                <TagPill key={item} text={item} />
              ))}
            </HStack>
          </VStack>

          {/* Children Status */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              Children Status
            </Text>
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {PROFILE.childrenStatus.map((item) => (
                <TagPill key={item} text={item} />
              ))}
            </HStack>
          </VStack>

          {/* My Gallery Mini Grid */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              My Gallery
            </Text>
            <HStack space="md" h={180}>
              <Box flex={1} borderRadius="$xl" overflow="hidden">
                <Image
                  source={require("@/assets/images/react-logo.png")}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Box>
              <Pressable
                flex={1}
                borderRadius="$xl"
                overflow="hidden"
                position="relative"
                onPress={() => router.push("/profile-gallery")}
              >
                <Image
                  source={require("@/assets/images/react-logo.png")}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                {/* Overlay Arrow */}
                <Box
                  position="absolute"
                  top="40%"
                  right={-20}
                  bg="#E86673"
                  w={50}
                  h={50}
                  borderRadius="$full"
                  justifyContent="center"
                  pl="$4"
                >
                  <Text color="#FFFFFF" fontWeight="bold" size="lg">
                    {">"}
                  </Text>
                </Box>
              </Pressable>
            </HStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <Box
        px="$6"
        pt="$4"
        pb="$8"
        bg="#FFFFFF"
        borderTopWidth={1}
        borderTopColor="$borderLight50"
      >
        <Button
          size="xl"
          bg="#E86673"
          borderRadius="$full"
          onPress={() => console.log("Chat initiated!")}
        >
          <ButtonText fontWeight="$bold">
            Send {PROFILE.name} a Message
          </ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
