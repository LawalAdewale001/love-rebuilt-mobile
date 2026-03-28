import {
  Box,
  Button,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box flex={1} bg="#E86673">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          {/* Top Graphic Area */}
          <Box h={300} w="100%" position="relative">
            {/* Logo here */}
            <Image
              source={require("@/assets/images/signup-header-bg.png")}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: "30%",
                left: 0,
              }}
              contentFit="cover"
            />
          </Box>

          {/* Bottom Sheet Form */}
          <Box
            flex={1}
            bg="$white"
            borderTopLeftRadius={30}
            borderTopRightRadius={30}
            px="$6"
            pt="$8"
            pb="$10"
            mt={-30}
          >
            <VStack space="xl">
              <Box>
                <Text size="2xl" fontWeight="$bold" color="$textLight900">
                  Create an Account
                </Text>
                <Text size="md" color="$textLight600" mt="$1">
                  Start your journey to find love
                </Text>
              </Box>

              <VStack space="md">
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    placeholder="Full Name"
                    placeholderTextColor="$textLight400"
                  />
                </Input>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    placeholder="Email Address"
                    keyboardType="email-address"
                    placeholderTextColor="$textLight400"
                  />
                </Input>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password"
                    placeholderTextColor="$textLight400"
                  />
                  <InputSlot
                    pr="$4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {/* Add Eye/EyeOff icon mapping to your IconSymbol or use Gluestack icons */}
                    <Text>👁️</Text>
                  </InputSlot>
                </Input>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    placeholderTextColor="$textLight400"
                  />
                  <InputSlot
                    pr="$4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text>👁️</Text>
                  </InputSlot>
                </Input>
              </VStack>

              <HStack alignItems="center" space="sm" my="$2">
                <Divider flex={1} />
                <Text color="$textLight400" size="sm">
                  or
                </Text>
                <Divider flex={1} />
              </HStack>

              {/* Social Login placeholders */}
              <HStack justifyContent="center" space="lg">
                <Pressable
                  w={50}
                  h={50}
                  bg="$white"
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor="$borderLight200"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text>G</Text>
                </Pressable>
                <Pressable
                  w={50}
                  h={50}
                  bg="$textLight900"
                  borderRadius="$full"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$white"></Text>
                </Pressable>
              </HStack>

              <Button
                size="xl"
                bg="#E86673"
                borderRadius="$full"
                mt="$4"
                onPress={() => router.push("/verify-email")}
              >
                <ButtonText fontWeight="$bold">Create an Account</ButtonText>
              </Button>

              <HStack justifyContent="center" mt="$2">
                <Text color="$textLight600">Have an Account? </Text>
                <Pressable onPress={() => router.push("/sign-in")}>
                  <Text color="#E86673" fontWeight="$bold">
                    Sign In
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
