import { showToast } from "@/components/ui/toast";
import { useForm } from "@/hooks/use-form";
import { ApiError, apiClient } from "@/lib/api-client";
import { registerForPushNotifications } from "@/lib/push-notifications";
import { useLoginMutation, useSocialLoginMutation } from "@/lib/queries";
import { connectSocket } from "@/lib/socket";
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
import Joi from "joi";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// COMMENTED OUT FOR EXPO GO COMPATIBILITY
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import * as AppleAuthentication from "expo-apple-authentication";

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
    // TEMPORARILY DISABLED FOR EXPO GO
    showToast(
      "info",
      "Social Login",
      `${provider} login is disabled in Expo Go.`,
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
                    bg="#F5EFEA"
                    borderWidth={form.values.email || emailError ? 1.5 : 0}
                    borderColor={
                      emailError
                        ? "#E86A7A"
                        : form.values.email
                          ? "#1D1D1D"
                          : "transparent"
                    }
                  >
                    {form.values.email ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color={emailError ? "#E86A7A" : "$textLight500"}
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
                    <Text size="xs" color="#E86A7A" mt="$1" ml="$2">
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
                    bg="#F5EFEA"
                    borderWidth={
                      form.values.password || passwordError ? 1.5 : 0
                    }
                    borderColor={
                      passwordError
                        ? "#E86A7A"
                        : form.values.password
                          ? "#1D1D1D"
                          : "transparent"
                    }
                  >
                    {form.values.password ? (
                      <Text
                        position="absolute"
                        top={6}
                        left={16}
                        size="xs"
                        color={passwordError ? "#E86A7A" : "$textLight500"}
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
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#666666"
                      />
                    </InputSlot>
                  </Input>
                  {passwordError ? (
                    <Text size="xs" color="#E86A7A" mt="$1" ml="$2">
                      {passwordError}
                    </Text>
                  ) : null}
                </Box>
              </VStack>



              {/* Main Action Button */}
              <Button
                size="xl"
                bg={canSubmit ? "#E86A7A" : "#F5EFEA"}
                borderRadius="$full"
                mt="$1"
                disabled={!canSubmit}
                onPress={handleSignIn}
              >
                {loginMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText
                    fontWeight="$bold"
                    color={canSubmit ? "#FFFFFF" : "#CFCFCF"}
                  >
                    Sign In
                  </ButtonText>
                )}
              </Button>

              {/* Footer Links */}
              <HStack justifyContent="center" mb="$4">
                <Text color="#1D1D1D">Don't have an Account? </Text>
                <Pressable
                  onPress={() => router.push("/sign-up")}
                  disabled={isAnyLoading}
                >
                  <Text color="#E86A7A" fontWeight="$bold">
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
