import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.outerContainer}>
      <ImageBackground
        source={require("@/assets/images/bg-image.png")}
        style={styles.background}
        // Use imageStyle to control the actual image rendering
        imageStyle={styles.bgImageContent}
        resizeMode="contain"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require("@/assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.push("/sign-in")}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.title}>
              Everyone deserves{"\n"}another chance at love.
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/sign-up")}
            >
              <Text style={styles.primaryBtnText}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#E86673",
  },
  background: {
    flex: 1,
  },
  bgImageContent: {
    // This ensures the image stays at its natural aspect ratio
    // and is centered within the ImageBackground view
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logo: { width: 120, height: 40 },
  signInBtn: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  signInText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  heroSection: { paddingHorizontal: 24, marginTop: 32 },
  title: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", lineHeight: 40 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  primaryBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#1A1A1A", fontSize: 18, fontWeight: "700" },
});
