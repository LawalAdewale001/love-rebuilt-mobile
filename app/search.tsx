import {
    Box,
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
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data
const SEARCH_RESULTS = [
  {
    id: 1,
    name: "Princess",
    age: 26,
    verified: true,
    tags: ["Singing", "Anime Fan", "+5"],
  },
  {
    id: 2,
    name: "Pricia",
    age: 24,
    verified: true,
    tags: ["Singing", "Anime Fan", "+5"],
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Search
        </Text>
        <Pressable
          position="absolute"
          right={24}
          onPress={() => router.back()}
          p="$2"
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$full"
          w={32}
          h={32}
          justifyContent="center"
          alignItems="center"
        >
          <Text size="sm" color="#1A1A1A" fontWeight="bold">
            ✕
          </Text>
        </Pressable>
      </Box>

      <VStack flex={1} px="$6" pt="$2">
        {/* Search Input */}
        <Input
          size="xl"
          variant="outline"
          borderRadius="$full"
          borderColor={searchQuery ? "#E86673" : "$borderLight400"}
          borderWidth={1}
          bg="#FFFFFF"
        >
          <InputSlot pl="$4">
            <Text size="lg">🔍</Text>
          </InputSlot>
          <InputField
            placeholder="Search for a match"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </Input>

        {/* Results List */}
        <ScrollView mt="$6" showsVerticalScrollIndicator={false}>
          {searchQuery.length > 0 &&
            SEARCH_RESULTS.map((user, index) => (
              <Box key={user.id}>
                <Pressable
                  onPress={() => router.push("/profile-detail")}
                  py="$4"
                >
                  <HStack space="md" alignItems="center">
                    {/* Avatar */}
                    <Box w={48} h={48} borderRadius="$full" overflow="hidden">
                      <Image
                        source={require("@/assets/images/react-logo.png")} // Placeholder
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </Box>

                    {/* Info */}
                    <VStack space="xs">
                      <HStack alignItems="center" space="xs">
                        <Text
                          size="lg"
                          fontWeight="$bold"
                          color="$textLight900"
                        >
                          {user.name}, {user.age}
                        </Text>
                        {user.verified && <Text>✅</Text>}
                      </HStack>

                      <HStack space="sm">
                        {user.tags.map((tag) => (
                          <Box
                            key={tag}
                            bg="#F7F5F4"
                            px="$3"
                            py="$1"
                            borderRadius="$full"
                          >
                            <Text
                              size="xs"
                              color="$textLight600"
                              fontWeight="$medium"
                            >
                              {tag}
                            </Text>
                          </Box>
                        ))}
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
                {index < SEARCH_RESULTS.length - 1 && (
                  <Divider bg="$borderLight200" />
                )}
              </Box>
            ))}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
