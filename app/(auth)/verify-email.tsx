import { showToast } from "@/components/ui/toast";
import { useResendCodeMutation, useVerifyEmailMutation } from "@/lib/queries";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>(); // Grabs email from router

  const [code, setCode] = useState(["", "", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const [timer, setTimer] = useState(60);
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendCodeMutation();

  // Handle countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) return; // Prevent pasting multiple chars in one box directly

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text !== "" && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move back on backspace if box is empty
    if (e.nativeEvent.key === "Backspace" && code[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 5) return;

    verifyMutation.mutate(
      { email: email || "", code: fullCode },
      {
        onSuccess: () => {
          showToast("success", "Verified!", "Email verified successfully.");
          router.replace("/location"); // Start profile building
        },
        onError: (error: any) => {
          showToast(
            "error",
            "Verification Failed",
            error?.message || "Invalid code",
          );
        },
      },
    );
  };

  const handleResend = () => {
    if (timer > 0 || !email) return;

    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setTimer(60);
          showToast(
            "success",
            "Code Sent",
            "A new verification code has been sent.",
          );
        },
        onError: (error: any) => {
          showToast(
            "error",
            "Failed",
            error?.message || "Could not resend code.",
          );
        },
      },
    );
  };

  const isCodeComplete = code.join("").length === 5;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <VStack
            flex={1}
            px="$6"
            pt="$6"
            justifyContent="space-between"
            pb="$8"
          >
            <Box>
              <Text size="2xl" fontWeight="$bold" color="$textLight900">
                Let's Verify your Mail
              </Text>
              <Text size="md" color="$textLight600" mt="$1">
                Enter the 5 digits sent to {email || "your email"}
              </Text>

              <HStack space="sm" mt="$8" justifyContent="space-between">
                {code.map((digit, index) => (
                  <Box
                    key={index}
                    w={56}
                    h={64}
                    bg="#F7F5F4"
                    borderRadius="$xl"
                    borderWidth={1}
                    borderColor={digit ? "#1A1A1A" : "$borderLight300"}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <TextInput
                      ref={(el) => (inputsRef.current[index] = el)}
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "100%",
                        height: "100%",
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                    />
                  </Box>
                ))}
              </HStack>
            </Box>

            <VStack space="lg" alignItems="center" mt="$10">
              <Text fontWeight="$bold" size="lg">
                00:{timer.toString().padStart(2, "0")}
              </Text>
              <HStack>
                <Text color="$textLight600">Didn't get code? </Text>
                <Pressable
                  onPress={handleResend}
                  disabled={timer > 0 || resendMutation.isPending}
                >
                  <Text
                    color={timer > 0 ? "$textLight400" : "#E86673"}
                    fontWeight="$bold"
                  >
                    Resend Code
                  </Text>
                </Pressable>
              </HStack>

              <Button
                w="100%"
                size="xl"
                bg={isCodeComplete ? "#E86673" : "#F4F3F2"}
                borderRadius="$full"
                disabled={!isCodeComplete || verifyMutation.isPending}
                onPress={handleVerify}
              >
                {verifyMutation.isPending ? (
                  <ButtonSpinner color="#FFFFFF" />
                ) : (
                  <ButtonText
                    fontWeight="$bold"
                    color={isCodeComplete ? "#FFFFFF" : "$textLight400"}
                  >
                    Continue
                  </ButtonText>
                )}
              </Button>
            </VStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
