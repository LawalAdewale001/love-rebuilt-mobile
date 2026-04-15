import { showToast } from "@/components/ui/toast";
import { useForm } from "@/hooks/use-form";
import { ApiError, apiClient } from "@/lib/api-client";
import { registerForPushNotifications } from "@/lib/push-notifications";
import { useLoginMutation, useSocialLoginMutation } from "@/lib/queries";
import { connectSocket } from "@/lib/socket";
import { Ionicons } from "@expo/vector-icons";
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
import Joi from "joi";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
});

export default function SignInScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLoginMutation();
  const socialLoginMutation = useSocialLoginMutation();

  const form = useForm({ email: "", password: "" }, loginSchema);

  const isFormFilled =
    form.values.email.trim().length > 0 &&
    form.values.password.trim().length > 0;

  // Disable regular submit if ANY mutation is running
  const isAnyLoading = loginMutation.isPending || socialLoginMutation.isPending;
  const canSubmit = isFormFilled && !isAnyLoading;

  const emailError = form.getError("email");
  const passwordError = form.getError("password");

  const handleSignIn = () => {
    const validated = form.validate();
    if (!validated) {
      const firstError = form.fieldErrors.email ?? form.fieldErrors.password;
      if (firstError) showToast("error", "Validation Error", firstError);
      return;
    }

    const pushTokenPromise = registerForPushNotifications();

    loginMutation.mutate(
      { email: validated.email, password: validated.password },
      {
        onSuccess: () => {
          connectSocket();
          router.replace("/(tabs)");
          pushTokenPromise.then((token) => {
            if (token) {
              apiClient
                .patch("/api/user/update", { devicePushToken: token })
                .catch(() => {});
            }
          });
        },
        onError: (error) => {
          const message =
            error instanceof ApiError
              ? error.message
              : "Something went wrong. Please try again.";
          showToast("error", "Sign In Failed", message);
        },
      },
    );
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      let token = "";

      if (provider === "google") {
        // TODO: Await your Google Sign-In library execution here to extract the ID token
        // Example:
        // await GoogleSignin.hasPlayServices();
        // const userInfo = await GoogleSignin.signIn();
        // token = userInfo.idToken;
      } else {
        // TODO: Await your Apple Sign-In library execution here to extract the identityToken
        // Example:
        // const credential = await AppleAuthentication.signInAsync({ requestedScopes: [...] });
        // token = credential.identityToken;
      }

      if (!token) return; // User cancelled the flow

      const pushTokenPromise = registerForPushNotifications();

      socialLoginMutation.mutate(
        { provider, token },
        {
          onSuccess: () => {
            connectSocket();
            router.replace("/(tabs)");
            pushTokenPromise.then((pushToken) => {
              if (pushToken) {
                apiClient
                  .patch("/api/user/update", { devicePushToken: pushToken })
                  .catch(() => {});
              }
            });
          },
          onError: (error) => {
            const message =
              error instanceof ApiError
                ? error.message
                : `Failed to sign in with ${provider}.`;
            showToast("error", "Authentication Failed", message);
          },
        },
      );
    } catch (error) {
      // Handles cases where the user dismisses the native social login modal
      console.log(`${provider} login cancelled or failed natively:`, error);
    }
  };

  return (
    <Box flex={1} bg="#E86673">
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
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg={form.values.email ? "#FFFFFF" : "#F7F5F4"}
                    borderWidth={emailError ? 1 : form.values.email ? 1 : 0}
                    borderColor={
                      emailError
                        ? "#E86673"
                        : form.values.email
                          ? "#1A1A1A"
                          : "transparent"
                    }
                  >
                    {form.values.email ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color={emailError ? "#E86673" : "$textLight500"}
                      >
                        Email Address
                      </Text>
                    ) : null}
                    <InputField
                      placeholder={form.values.email ? "" : "Email Address"}
                      placeholderTextColor="$textLight400"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.values.email}
                      onChangeText={(val: string) =>
                        form.setValue("email", val)
                      }
                      onBlur={() => form.onBlur("email")}
                      pt={form.values.email ? "$4" : "$0"}
                    />
                  </Input>
                  {emailError ? (
                    <Text size="xs" color="#E86673" mt="$1" ml="$2">
                      {emailError}
                    </Text>
                  ) : null}
                </Box>

                {/* Password Input */}
                <Box>
                  <Input
                    size="xl"
                    variant="outline"
                    borderRadius="$xl"
                    bg={form.values.password ? "#FFFFFF" : "#F7F5F4"}
                    borderWidth={
                      passwordError ? 1 : form.values.password ? 1 : 0
                    }
                    borderColor={
                      passwordError
                        ? "#E86673"
                        : form.values.password
                          ? "#1A1A1A"
                          : "transparent"
                    }
                  >
                    {form.values.password ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color={passwordError ? "#E86673" : "$textLight500"}
                      >
                        Password
                      </Text>
                    ) : null}
                    <InputField
                      type={showPassword ? "text" : "password"}
                      placeholder={form.values.password ? "" : "Enter Password"}
                      placeholderTextColor="$textLight400"
                      value={form.values.password}
                      onChangeText={(val: string) =>
                        form.setValue("password", val)
                      }
                      onBlur={() => form.onBlur("password")}
                      pt={form.values.password ? "$4" : "$0"}
                    />
                    <InputSlot
                      pr="$4"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text>👁️</Text>
                    </InputSlot>
                  </Input>
                  {passwordError ? (
                    <Text size="xs" color="#E86673" mt="$1" ml="$2">
                      {passwordError}
                    </Text>
                  ) : null}
                </Box>
              </VStack>

              <HStack alignItems="center" space="sm" my="$2">
                <Divider flex={1} />
                <Text color="$textLight400" size="sm">
                  or
                </Text>
                <Divider flex={1} />
              </HStack>

              {/* Social Login Buttons */}
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
                  onPress={() => handleSocialLogin("google")}
                  disabled={isAnyLoading}
                >
                  {socialLoginMutation.isPending &&
                  socialLoginMutation.variables?.provider === "google" ? (
                    <Spinner size="small" color="#1A1A1A" />
                  ) : (
                    <Image
                      source={{
                        uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
                      }}
                      style={{ width: 24, height: 24 }}
                    />
                  )}
                </Pressable>

                {Platform.OS === "ios" && (
                  <Pressable
                    w={50}
                    h={50}
                    bg="$textLight900"
                    borderRadius="$full"
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => handleSocialLogin("apple")}
                    disabled={isAnyLoading}
                  >
                    {socialLoginMutation.isPending &&
                    socialLoginMutation.variables?.provider === "apple" ? (
                      <Spinner size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                    )}
                  </Pressable>
                )}
              </HStack>

              <Button
                size="xl"
                bg={canSubmit ? "#E86673" : "#F4F3F2"}
                borderRadius="$full"
                mt="$4"
                disabled={!canSubmit}
                onPress={handleSignIn}
                style={
                  canSubmit
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
                {loginMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText
                    fontWeight="$bold"
                    color={canSubmit ? "#FFFFFF" : "$textLight400"}
                  >
                    Sign In
                  </ButtonText>
                )}
              </Button>

              <HStack justifyContent="center" mb="$2">
                <Text color="$textLight600">Don't have an Account? </Text>
                <Pressable
                  onPress={() => router.push("/sign-up")}
                  disabled={isAnyLoading}
                >
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
