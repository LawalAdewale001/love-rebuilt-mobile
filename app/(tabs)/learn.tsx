import { useMiniCoursesQuery, type CourseCategory } from "@/lib/queries";
import {
  Box,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LearnScreen() {
  const router = useRouter();

  // Fetching the categories array
  const { data: categories, isLoading, error } = useMiniCoursesQuery();

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
        }}
      >
        <Spinner size="large" color="#E86673" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text color="$error500">Failed to load courses. Please try again.</Text>
      </SafeAreaView>
    );
  }

  // Handle Navigation and pass data via params
  const handleCoursePress = (
    id: string,
    videoUrl: string,
    title: string,
    description: string,
  ) => {
    router.push({
      pathname: "/video-player",
      params: {
        id,
        videoUrl,
        title,
        description,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box px="$6" py="$4" alignItems="center" justifyContent="center">
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Learn
        </Text>
      </Box>

      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <VStack space="2xl" mt="$4">
          {/* Map through the Categories array */}
          {categories?.map((category: CourseCategory) => (
            <VStack key={category.id} space="md">
              <Text px="$6" size="md" fontWeight="$bold" color="$textLight900">
                {category.name}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {category.miniCourses?.map((course) => (
                  <Pressable
                    key={course.id}
                    w={160}
                    h={200}
                    borderRadius="$2xl"
                    overflow="hidden"
                    position="relative"
                    onPress={() =>
                      handleCoursePress(
                        course.id,
                        course.videoUrl,
                        course.title,
                        course.description,
                      )
                    }
                  >
                    <Image
                      source={{ uri: course.thumbnailUrl }}
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                      }}
                      contentFit="cover"
                    />

                    {/* Gradient Overlay */}
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      h="60%"
                      bg="$black"
                      opacity={0.6}
                    />

                    {/* Play Icon Centered */}
                    <Box
                      position="absolute"
                      top={0}
                      bottom={0}
                      left={0}
                      right={0}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Box
                        w={40}
                        h={40}
                        bg="rgba(255,255,255,0.3)"
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        pl="$1"
                      >
                        <Text color="#FFFFFF" size="lg">
                          ▶
                        </Text>
                      </Box>
                    </Box>

                    {/* Bottom Text */}
                    <VStack
                      position="absolute"
                      bottom={16}
                      left={16}
                      right={16}
                      zIndex={10}
                    >
                      <Text
                        color="#FFFFFF"
                        fontWeight="$bold"
                        size="md"
                        numberOfLines={2}
                      >
                        {course.title}
                      </Text>
                      {course.duration && (
                        <Text color="$textLight300" size="xs" mt="$1">
                          {course.duration} mins
                        </Text>
                      )}
                    </VStack>
                  </Pressable>
                ))}
              </ScrollView>
            </VStack>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
