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

export default function SignInScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // States to track input values for dynamic styling
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Button becomes active when both fields have text
  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <Box flex={1} bg="#E86673">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          {/* Top Graphic Area */}
          <Box h={350} w="100%" position="relative">
            {/* Make sure to export your SignIn background graphic from Figma and put it in assets */}
            <Image
              source={require("@/assets/images/signup-header-bg.png")} // Using your existing bg as placeholder, swap if needed!
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
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
                  Sign In
                </Text>
                <Text size="md" color="$textLight600" mt="$1">
                  Continue your love conversation
                </Text>
              </Box>

              <VStack space="md" mt="$4">
                {/* Email Input */}
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={email ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={email ? 1 : 0}
                  borderColor={email ? "#1A1A1A" : "transparent"}
                >
                  {email ? (
                    <Text
                      position="absolute"
                      top={6}
                      left={16}
                      size="xs"
                      color="$textLight500"
                    >
                      Email Address
                    </Text>
                  ) : null}
                  <InputField
                    placeholder={email ? "" : "Email Address"}
                    placeholderTextColor="$textLight400"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    pt={email ? "$4" : "$0"}
                  />
                </Input>

                {/* Password Input */}
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={password ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={password ? 1 : 0}
                  borderColor={password ? "#1A1A1A" : "transparent"}
                >
                  {password ? (
                    <Text
                      position="absolute"
                      top={6}
                      left={16}
                      size="xs"
                      color="$textLight500"
                    >
                      Password
                    </Text>
                  ) : null}
                  <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder={password ? "" : "Enter Password"}
                    placeholderTextColor="$textLight400"
                    value={password}
                    onChangeText={setPassword}
                    pt={password ? "$4" : "$0"}
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
                  <Text fontWeight="bold">G</Text>
                </Pressable>
                <Pressable
                  w={50}
                  h={50}
                  bg="$textLight900"
                  borderRadius="$full"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$white" fontWeight="bold">
                    
                  </Text>
                </Pressable>
              </HStack>

              <Button
                size="xl"
                bg={isFormValid ? "#E86673" : "#F4F3F2"}
                borderRadius="$full"
                mt="$4"
                disabled={!isFormValid}
                onPress={() => router.replace("/(tabs)")} // Assuming sign in takes them to the main app
                style={
                  isFormValid
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 3,
                      }
                    : {}
                }
              >
                <ButtonText
                  fontWeight="$bold"
                  color={isFormValid ? "#FFFFFF" : "$textLight400"}
                >
                  Sign In
                </ButtonText>
              </Button>

              <HStack justifyContent="center" mt="$2">
                <Text color="$textLight600">Don't have an Account? </Text>
                <Pressable onPress={() => router.push("/sign-up")}>
                  <Text color="#E86673" fontWeight="$bold">
                    Create an Account
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
