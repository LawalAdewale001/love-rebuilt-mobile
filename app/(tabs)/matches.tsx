import { PRIMARY_COLOR } from "@/constants/theme";
import { useDiscoveryMatchesQuery } from "@/lib/queries";
import {
  Box,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function MatchesScreen() {
  const router = useRouter();

  // Fetch Matches
  const { data: matches, isLoading, error } = useDiscoveryMatchesQuery();

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
          <Pressable
            position="absolute"
            right={24}
            w={44}
            h={44}
            bg={PRIMARY_COLOR}
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            onPress={() => router.push("/modal")}
          >
            <Image
              source={require("@/assets/images/icon-filter.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          </Pressable>
        </Box>

        {/* Content State Handling */}
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color={PRIMARY_COLOR} />
          </Box>
        ) : error ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text color="$textLight500">Failed to load matches.</Text>
          </Box>
        ) : matches && matches.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 24,
              paddingTop: 16,
            }}
            snapToInterval={width * 0.85 + 16}
            decelerationRate="fast"
          >
            {matches.map((match, index) => {
              // Added index here
              const age = match.dob
                ? new Date().getFullYear() - new Date(match.dob).getFullYear()
                : "";

              return (
                <Pressable
                  key={match.id}
                  w={width * 0.85}
                  h="100%"
                  mr={index === matches.length - 1 ? 0 : 16} // Replaced Gap with margin-right
                  borderRadius={30}
                  overflow="hidden"
                  position="relative"
                  onPress={() =>
                    router.push({
                      pathname: "/profile-detail",
                      params: { id: match.id },
                    })
                  }
                >
                  <Image
                    source={{
                      uri:
                        match.avatar ||
                        match.pictures?.[0] ||
                        "https://via.placeholder.com/400",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                    }}
                    contentFit="cover"
                  />

                  <Box
                    position="absolute"
                    top={16}
                    left={16}
                    bg="#FFFFFF"
                    opacity={0.9}
                    py="$2"
                    px="$4"
                    borderRadius="$full"
                    zIndex={10}
                  >
                    <HStack space="xs" alignItems="center">
                      <Image
                        source={require("@/assets/images/icon-status.png")}
                        style={{ width: 16, height: 16 }}
                        contentFit="contain"
                      />
                      <Text fontWeight="500" fontSize={12} color="#1D1D1D">
                        {match.relationshipGoal || "Open to Dating"}
                      </Text>
                    </HStack>
                  </Box>

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
                      />
                      <Text color="#FFFFFF" fontSize={12} fontWeight="400" lineHeight={22}>
                        {match.location || "Unknown Location"}
                      </Text>
                    </HStack>

                    <HStack space="xs" alignItems="center" mb="$3">
                      <Text color="#FFFFFF" fontSize={17} fontWeight="600" lineHeight={22}>
                        {match.fullName?.split(" ")[0]}
                        {age ? `, ${age}` : ""}
                      </Text>
                      {match.isVerified && (
                        <Image
                          source={require("@/assets/images/icon-verified.png")}
                          style={{ width: 24, height: 24 }}
                          contentFit="contain"
                        />
                      )}
                    </HStack>

                    <HStack
                      space="md"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box flex={1}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <HStack space="sm" flexWrap="nowrap" alignItems="center">
                            {(() => {
                              const displayTags = match.interests?.length 
                                ? match.interests 
                                : [match.religion, match.tribe, match.childrenStatus].filter(Boolean);

                              return (
                                <>
                                  {displayTags.slice(0, 2).map((tag: string, idx: number) => (
                                    <Box
                                      key={idx}
                                      bg="rgba(255,255,255,0.2)"
                                      px="$4"
                                      py="$2"
                                      borderRadius="$full"
                                    >
                                      <Text
                                        color="#FFFFFF"
                                        fontSize={12}
                                        fontWeight="500"
                                        lineHeight={22}
                                      >
                                        {tag}
                                      </Text>
                                    </Box>
                                  ))}
                                  {displayTags.length > 2 && (
                                    <Box
                                      bg="rgba(255,255,255,0.2)"
                                      px="$4"
                                      py="$2"
                                      borderRadius="$full"
                                    >
                                      <Text
                                        color="#FFFFFF"
                                        fontSize={12}
                                        fontWeight="500"
                                        lineHeight={22}
                                      >
                                        +{displayTags.length - 2}
                                      </Text>
                                    </Box>
                                  )}
                                </>
                              );
                            })()}
                          </HStack>
                        </ScrollView>
                      </Box>

                      {/* We can route them to chat when clicking the heart on the matches tab since they already matched */}
                      <Pressable
                        w={56}
                        h={56}
                        bg={PRIMARY_COLOR}
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        ml="$2"
                        onPress={() =>
                          router.push({
                            pathname: "/chat-conversation",
                            params: {
                              recipientId: match.id,
                              name: match.fullName,
                            },
                          })
                        }
                      >
                        <Image
                          source={require("@/assets/images/icon-heart.png")}
                          style={{ width: 24, height: 24 }}
                          contentFit="contain"
                        />
                      </Pressable>
                    </HStack>
                  </VStack>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text color="$textLight500" textAlign="center">
              No matches found yet.{"\n"}Keep discovering!
            </Text>
          </Box>
        )}
      </VStack>
    </SafeAreaView>
  );
}
