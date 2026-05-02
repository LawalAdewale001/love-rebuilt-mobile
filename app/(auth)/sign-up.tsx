import { showToast } from "@/components/ui/toast";
import { useRegisterMutation, useSocialLoginMutation } from "@/lib/queries";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// COMMENTED OUT FOR EXPO GO COMPATIBILITY
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import * as AppleAuthentication from "expo-apple-authentication";

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const socialLoginMutation = useSocialLoginMutation();
  const registerMutation = useRegisterMutation();

  const isFormFilled =
    fullName.trim() && email.trim() && password && confirmPassword;

  const isAnyLoading =
    registerMutation.isPending || socialLoginMutation.isPending;
  const canSubmit = isFormFilled && !isAnyLoading;

  const handleSocialLogin = async (provider: "google" | "apple") => {
    // TEMPORARILY DISABLED FOR EXPO GO
    showToast(
      "info",
      "Social Login",
      `${provider} login is disabled in Expo Go.`,
    );
  };

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      showToast("error", "Validation Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      showToast(
        "error",
        "Validation Error",
        "Password must be at least 6 characters",
      );
      return;
    }

    registerMutation.mutate(
      { fullName: fullName.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          showToast(
            "success",
            "Account Created",
            "Please verify your email address.",
          );
          router.push({
            pathname: "/verify-email",
            params: { email: email.trim() },
          });
        },
        onError: (error: any) => {
          const message = error?.message || "Registration failed. Try again.";
          showToast("error", "Sign Up Failed", message);
        },
      },
    );
  };

  return (
    <Box flex={1} bg="#FFFBFB">
      {/* Split Background Trick: Protects the top safe area and image blending with red */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="50%"
        bg="#E86673"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          {/* Top Graphic Area */}
          <Box h={350} w="100%" position="relative">
            <Image
              source={require("@/assets/images/signup-header-bg.png")}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              contentFit="cover"
            />
            {/* Logo overlay at the top left */}
            <SafeAreaView
              edges={["top"]}
              style={{ position: "absolute", top: 16, left: 24 }}
            >
              <Image
                source={require("@/assets/logo.png")}
                style={{ width: 120, height: 40 }}
                contentFit="contain"
              />
            </SafeAreaView>
          </Box>

          {/* Bottom Sheet Form */}
          <Box
            flex={1}
            bg="#FFFBFB"
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

              <VStack space="md" mt="$4">
                {/* Full Name Input */}
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F5EFEA"
                    borderWidth={fullName ? 1.5 : 0}
                    borderColor={fullName ? "#1D1D1D" : "transparent"}
                  >
                    {fullName ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color="$textLight500"
                      >
                        Full Name
                      </Text>
                    ) : null}
                    <InputField
                      placeholder={fullName ? "" : "Full Name"}
                      placeholderTextColor="$textLight400"
                      value={fullName}
                      onChangeText={setFullName}
                      pt={fullName ? "$4" : "$0"}
                    />
                  </Input>
                </Box>

                {/* Email Input */}
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F5EFEA"
                    borderWidth={email ? 1.5 : 0}
                    borderColor={email ? "#1D1D1D" : "transparent"}
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
                </Box>

                {/* Password Input */}
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F5EFEA"
                    borderWidth={password ? 1.5 : 0}
                    borderColor={password ? "#1D1D1D" : "transparent"}
                  >
                    {password ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color="$textLight500"
                      >
                        Create Password
                      </Text>
                    ) : null}
                    <InputField
                      type={showPassword ? "text" : "password"}
                      placeholder={password ? "" : "Create Password"}
                      placeholderTextColor="$textLight400"
                      value={password}
                      onChangeText={setPassword}
                      pt={password ? "$4" : "$0"}
                    />
                    <InputSlot
                      pr="$4"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#666666"
                      />
                    </InputSlot>
                  </Input>
                </Box>

                {/* Confirm Password Input */}
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg="#F5EFEA"
                    borderWidth={confirmPassword ? 1.5 : 0}
                    borderColor={confirmPassword ? "#1D1D1D" : "transparent"}
                  >
                    {confirmPassword ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color="$textLight500"
                      >
                        Confirm Password
                      </Text>
                    ) : null}
                    <InputField
                      type={showPassword ? "text" : "password"}
                      placeholder={confirmPassword ? "" : "Confirm Password"}
                      placeholderTextColor="$textLight400"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      pt={confirmPassword ? "$4" : "$0"}
                    />
                    <InputSlot
                      pr="$4"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#666666"
                      />
                    </InputSlot>
                  </Input>
                </Box>
              </VStack>

              <HStack alignItems="center" space="sm">
                <Divider flex={1} />
                <Text color="$textLight400" size="sm">
                  or
                </Text>
                <Divider flex={1} />
              </HStack>

              {/* Social Login Buttons */}
              <HStack justifyContent="center" space="lg">
                <Pressable
                  w={56}
                  h={56}
                  bg="#FFFFFF"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor="#1D1D1D"
                  justifyContent="center"
                  alignItems="center"
                  onPress={() => handleSocialLogin("google")}
                  disabled={isAnyLoading}
                >
                  {socialLoginMutation.isPending &&
                  socialLoginMutation.variables?.provider === "google" ? (
                    <Spinner size="small" color="#1A1A1A" />
                  ) : (
                    <Image
                      source={require("@/assets/images/google-icon.png")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  )}
                </Pressable>

                <Pressable
                  w={56}
                  h={56}
                  bg="#FFFFFF"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor="#1D1D1D"
                  justifyContent="center"
                  alignItems="center"
                  onPress={() => handleSocialLogin("apple")}
                  disabled={isAnyLoading}
                >
                  {socialLoginMutation.isPending &&
                  socialLoginMutation.variables?.provider === "apple" ? (
                    <Spinner size="small" color="#1A1A1A" />
                  ) : (
                    <Image
                      source={require("@/assets/images/apple-icon.png")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  )}
                </Pressable>
              </HStack>

              {/* Main Action Button */}
              <Button
                size="xl"
                bg={canSubmit ? "#E86A7A" : "#F5EFEA"}
                borderRadius="$full"
                disabled={!canSubmit}
                onPress={handleSignUp}
              >
                {registerMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText
                    fontWeight="$bold"
                    color={canSubmit ? "#FFFFFF" : "#CFCFCF"}
                  >
                    Create an Account
                  </ButtonText>
                )}
              </Button>

              {/* Footer Links */}
              <HStack justifyContent="center" mb="$4">
                <Text color="#1D1D1D">Have an Account? </Text>
                <Pressable
                  onPress={() => router.push("/sign-in")}
                  disabled={isAnyLoading}
                >
                  <Text color="#E86A7A" fontWeight="$bold">
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
