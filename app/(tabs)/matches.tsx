import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    Box,
    HStack,
    Pressable,
    ScrollView,
    Text,
    VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Mock Data for Matches
const MATCHES = [
  {
    id: 1,
    name: "Ifeoma",
    age: 27,
    status: "Ready for Relationship",
    location: "Lagos, Nigeria",
    verified: true,
    tags: ["Artist", "Foodie", "+5"],
    image: require("@/assets/images/react-logo.png"), // Replace with actual asset
  },
  {
    id: 2,
    name: "Sarah",
    age: 25,
    status: "Open to Dating",
    location: "Abuja, Nigeria",
    verified: true,
    tags: ["Traveler", "Techie", "+2"],
    image: require("@/assets/images/react-logo.png"), // Replace with actual asset
  },
];

export default function MatchesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1} pt="$2">
        {/* Header Section */}
        <Box
          px="$6"
          py="$2"
          position="relative"
          justifyContent="center"
          alignItems="center"
        >
          <Text size="xl" fontWeight="$bold" color="$textLight900">
            Best Matches for You
          </Text>

          {/* Filter Button */}
          <Pressable
            position="absolute"
            right={24}
            w={44}
            h={44}
            bg="#E86673"
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            onPress={() => router.push("/modal")} // Opens the filter screen!
          >
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
            {/* Replace with your filter icon */}
          </Pressable>
        </Box>

        {/* Horizontal Carousel of Match Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: 16,
            gap: 16,
          }}
          snapToInterval={width * 0.85 + 16} // Snaps smoothly to each card
          decelerationRate="fast"
        >
          {MATCHES.map((match) => (
            <Pressable
              key={match.id}
              w={width * 0.85} // Card takes up 85% of screen width so the next one peeks in
              h="100%"
              borderRadius={30}
              overflow="hidden"
              position="relative"
              onPress={() => router.push("/profile-detail")} // Opens the detail view!
            >
              {/* Card Image */}
              <Image
                source={match.image}
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
                  <Text>🤍</Text>
                  <Text fontWeight="$semibold" size="sm" color="#1A1A1A">
                    {match.status}
                  </Text>
                </HStack>
              </Box>

              {/* Bottom Info Gradient Overlay */}
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
                <HStack space="xs" alignItems="center" mb="$2">
                  <Text color="#FFFFFF">📍</Text>
                  <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                    {match.location}
                  </Text>
                </HStack>

                <HStack space="xs" alignItems="center" mb="$3">
                  <Text color="#FFFFFF" size="3xl" fontWeight="$bold">
                    {match.name}, {match.age}
                  </Text>
                  {match.verified && <Text size="xl">✅</Text>}
                </HStack>

                <HStack
                  space="md"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack space="sm" flexWrap="wrap" flex={1}>
                    {match.tags.map((tag) => (
                      <Box
                        key={tag}
                        bg="rgba(255,255,255,0.2)"
                        px="$4"
                        py="$2"
                        borderRadius="$full"
                      >
                        <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                          {tag}
                        </Text>
                      </Box>
                    ))}
                  </HStack>

                  {/* Floating Heart Button */}
                  <Pressable
                    w={56}
                    h={56}
                    bg="#E86673"
                    borderRadius="$full"
                    justifyContent="center"
                    alignItems="center"
                    ml="$2"
                  >
                    <IconSymbol
                      name="chevron.right"
                      size={28}
                      color="#FFFFFF"
                    />
                    {/* Replace with heart */}
                  </Pressable>
                </HStack>
              </VStack>
            </Pressable>
          ))}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
