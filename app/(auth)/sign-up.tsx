import { showToast } from "@/components/ui/toast";
import { useRegisterMutation, useSocialLoginMutation } from "@/lib/queries";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Text,
  VStack
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

// COMMENTED OUT FOR EXPO GO COMPATIBILITY
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import * as AppleAuthentication from "expo-apple-authentication";

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const socialLoginMutation = useSocialLoginMutation();
  const registerMutation = useRegisterMutation();

  const isAnyLoading =
    registerMutation.isPending || socialLoginMutation.isPending;
  const isFormFilled =
    fullName.trim() && email.trim() && password && confirmPassword;
  const canSubmit = isFormFilled && !isAnyLoading;

  const handleSocialLogin = async (provider: "google" | "apple") => {
    // TEMPORARILY DISABLED FOR EXPO GO
    showToast(
      "info",
      "Social Login",
      `${provider} login is disabled in Expo Go.`,
    );

    /*
    try {
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
      console.log(`${provider} error:`, error);
    }
    */
  };

  const handleSignUp = () => {
    if (password !== confirmPassword)
      return showToast("error", "Error", "Passwords do not match");

    registerMutation.mutate(
      { fullName: fullName.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          showToast(
            "success",
            "Account Created",
            "Check your email to verify.",
          );
          router.push({
            pathname: "/verify-email",
            params: { email: email.trim() },
          });
        },
        onError: (error: any) =>
          showToast("error", "Sign Up Failed", error?.message),
      },
    );
  };

  return (
    <Box flex={1} bg="#E86673">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <Box h={300} w="100%" position="relative">
            <Image
              source={require("@/assets/images/signup-header-bg.png")}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: "30%",
              }}
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
                  Create an Account
                </Text>
                <Text size="md" color="$textLight600" mt="$1">
                  Start your journey to find love
                </Text>
              </VStack>

              <VStack space="md">
                <Input
                  size="xl"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </Input>
                <Input
                  size="xl"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                  />
                </Input>
                <Input
                  size="xl"
                  borderRadius="$xl"
                  bg="#F7F5F4"
                  borderWidth={0}
                >
                  <InputField
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
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

              <HStack justifyContent="center" space="lg" mt="$4">
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
                onPress={handleSignUp}
              >
                {registerMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText color={canSubmit ? "#FFFFFF" : "$textLight400"}>
                    Create Account
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
