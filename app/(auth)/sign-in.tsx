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
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Joi from "joi";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

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

  const isAnyLoading = loginMutation.isPending || socialLoginMutation.isPending;
  const isFormFilled =
    form.values.email.trim().length > 0 &&
    form.values.password.trim().length > 0;
  const canSubmit = isFormFilled && !isAnyLoading;

  const emailError = form.getError("email");
  const passwordError = form.getError("password");

  const handleSignIn = () => {
    const validated = form.validate();
    if (!validated) return;

    const pushTokenPromise = registerForPushNotifications();
    loginMutation.mutate(
      { email: validated.email, password: validated.password },
      {
        onSuccess: () => {
          connectSocket();
          router.replace("/(tabs)");
          pushTokenPromise.then((token) => {
            if (token)
              apiClient
                .patch("/api/user/update", { devicePushToken: token })
                .catch(() => {});
          });
        },
        onError: (error) => {
          const message =
            error instanceof ApiError ? error.message : "Something went wrong.";
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
      `${provider} login is disabled in Expo Go. Use a Dev Build to test.`,
    );

    /* try {
      let token: string | undefined = "";
      if (provider === "google") {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        token = userInfo.data?.idToken ?? undefined;
      } else {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        token = credential.identityToken ?? undefined;
      }

      if (!token) return;

      socialLoginMutation.mutate({ provider, token }, {
        onSuccess: () => {
          connectSocket();
          router.replace("/(tabs)");
        },
        onError: (error) => {
          showToast("error", "Authentication Failed", error.message);
        },
      });
    } catch (error: any) {
      console.log(`${provider} login error:`, error);
    }
    */
  };

  return (
    <Box flex={1} bg="#E86673">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <Box h={350} w="100%" position="relative">
            <Image
              source={require("@/assets/images/signup-header-bg.png")}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </Box>
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
              <VStack>
                <Text size="2xl" fontWeight="$bold" color="$textLight900">
                  Sign In
                </Text>
                <Text size="md" color="$textLight600" mt="$1">
                  Continue your love conversation
                </Text>
              </VStack>

              <VStack space="md" mt="$4">
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={form.values.email ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={emailError ? 1 : 0}
                  borderColor={emailError ? "#E86673" : "#1A1A1A"}
                >
                  <InputField
                    placeholder="Email Address"
                    value={form.values.email}
                    onChangeText={(val) => form.setValue("email", val)}
                  />
                </Input>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={form.values.password ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={passwordError ? 1 : 0}
                  borderColor={passwordError ? "#E86673" : "#1A1A1A"}
                >
                  <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.values.password}
                    onChangeText={(val) => form.setValue("password", val)}
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
              </VStack>

              <HStack alignItems="center" space="sm" my="$2">
                <Divider flex={1} />
                <Text color="$textLight400" size="sm">
                  or
                </Text>
                <Divider flex={1} />
              </HStack>

              <HStack justifyContent="center" space="lg">
                <Pressable
                  onPress={() => handleSocialLogin("google")}
                  disabled={isAnyLoading}
                >
                  <Image
                    source={require("@/assets/images/google-icon.png")}
                    style={{ width: 50, height: 50 }}
                  />
                </Pressable>
                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => handleSocialLogin("apple")}
                    disabled={isAnyLoading}
                  >
                    <Image
                      source={require("@/assets/images/apple-icon.png")}
                      style={{ width: 50, height: 50 }}
                    />
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
              >
                {loginMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText color={canSubmit ? "#FFFFFF" : "$textLight400"}>
                    Sign In
                  </ButtonText>
                )}
              </Button>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
