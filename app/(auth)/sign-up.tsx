import { showToast } from "@/components/ui/toast";
import { useRegisterMutation } from "@/lib/queries";
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
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = useRegisterMutation();

  const isFormFilled =
    fullName.trim() && email.trim() && password && confirmPassword;
  const canSubmit = isFormFilled && !registerMutation.isPending;

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
          // Pass the email to the next screen so we know who to verify
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
                left: 0,
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
                    value={fullName}
                    onChangeText={setFullName}
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
                    autoCapitalize="none"
                    placeholderTextColor="$textLight400"
                    value={email}
                    onChangeText={setEmail}
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
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
                  w={50}
                  h={50}
                  bg="$white"
                  borderRadius="$12.08"
                  borderWidth={1}
                  borderColor="$borderLight200"
                  justifyContent="center"
                  alignItems="center"
                >
                  <MaterialIcons
                    name="g-mobiledata"
                    size={20}
                    color="#666666"
                  />
                </Pressable>
                <Pressable
                  w={50}
                  h={50}
                  bg="$textLight900"
                  borderRadius="$12.08"
                  justifyContent="center"
                  alignItems="center"
                >
                  <MaterialIcons name="apple" size={20} color="#FFFFFF" />
                </Pressable>
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
                  <ButtonText
                    fontWeight="$bold"
                    color={canSubmit ? "#FFFFFF" : "$textLight400"}
                  >
                    Create an Account
                  </ButtonText>
                )}
              </Button>

              <HStack justifyContent="center" mb="$2">
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
