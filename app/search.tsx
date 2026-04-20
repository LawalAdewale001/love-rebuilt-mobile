import { useUserSearchQuery } from "@/lib/queries"; // <-- Import Hook
import {
  Box,
  Divider,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search input so it doesn't spam your API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch results using the debounced query
  const { data: searchResults, isLoading } = useUserSearchQuery(debouncedQuery);

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
        >
          <Image
            source={require("@/assets/images/VectorCancel.png")}
            style={{ width: 19, height: 19 }}
            contentFit="contain"
          />
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
        >
          <InputSlot pl="$4">
            <Image
              source={require("@/assets/images/icon-search.png")}
              style={{ width: 19, height: 19 }}
              contentFit="contain"
            />
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
          {isLoading ? (
            <Box py="$10" alignItems="center">
              <Spinner size="large" color="#E86673" />
            </Box>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((user, index) => (
              <Box key={user.id}>
                {/* Pass the User ID to the profile detail screen! */}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/profile-detail",
                      params: { id: user.id },
                    })
                  }
                  py="$4"
                >
                  <HStack space="md" alignItems="center">
                    <Box
                      w={48}
                      h={48}
                      borderRadius="$full"
                      overflow="hidden"
                      bg="#F7F5F4"
                    >
                      <Image
                        source={{
                          uri:
                            user.avatar ||
                            "https://ui-avatars.com/api/?name=" + user.fullName,
                        }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </Box>
                    <VStack space="xs">
                      <HStack alignItems="center" space="xs">



                        <Text
                          size="md"
                          fontWeight="$bold"
                          color="$textLight900"
                        >
                          {user.fullName}{user.age ? `, ${user.age}` : ""}
                        </Text>
                        <Image
                          source={require("@/assets/images/icon-verified.png")}
                          style={{ width: 16, height: 16 }}
                          contentFit="contain"
                        />
                      </HStack>
                      <HStack space="sm">
                        {/* Display first 2 interests as tags if available */}
                        {user.interests?.slice(0, 2).map((tag) => (
                          <Box
                            key={tag}
                            bg="#F7F5F4"
                            px="$3"
                            py="$1"
                            borderRadius="$full"
                          >
                            <Text
                              size="xs"
                              color="$textLight900"
                              fontWeight="$medium"
                            >
                              {tag}
                            </Text>
                          </Box>
                        ))}
                        {user.interests?.length > 2 && (
                          <Box
                            bg="#F7F5F4"
                            px="$3"
                            py="$1"
                            borderRadius="$full"
                          >
                            <Text
                              size="xs"
                              color="$textLight900"
                              fontWeight="$medium"
                            >
                              +{user.interests.length - 2}
                            </Text>
                          </Box>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>
                {index < searchResults.length - 1 && (
                  <Divider bg="$borderLight200" />
                )}
              </Box>
            ))
          ) : debouncedQuery ? (
            <Box py="$10" alignItems="center">
              <Text color="$textLight500">No users found.</Text>
            </Box>
          ) : null}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
}
