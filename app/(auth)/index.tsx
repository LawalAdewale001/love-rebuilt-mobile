import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions to help with responsive absolute positioning
const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Background circles/shapes can be placed absolutely behind everything else */}
      {/* <Image source={require('@/assets/bg-circles.png')} style={styles.bgGraphic} /> */}

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/logo.png")} // Replace with your exact asset path
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.signInBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/sign-in")}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Typography */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>
          Everyone deserves{"\n"}another chance at love.
        </Text>
      </View>

      {/* Collage Section */}
      {/* This container takes up the remaining space. Elements inside are positioned absolutely. */}
      <View style={styles.collageContainer}>
        {/* Example: Top Left Image */}
        <Image
          source={require("@/assets/couple-left.png")}
          style={[styles.collageImage, styles.imgLeft]}
          resizeMode="contain"
        />

        {/* Example: Right Starburst Image */}
        <Image
          source={require("@/assets/couple-right.png")}
          style={[styles.collageImage, styles.imgRight]}
          resizeMode="contain"
        />

        {/* Example: Center Butterfly Image */}
        <Image
          source={require("@/assets/couple-center.png")}
          style={[styles.collageImage, styles.imgCenter]}
          resizeMode="contain"
        />

        {/* Example: Center Heart */}
        <Image
          source={require("@/assets/heart-center.png")}
          style={[styles.collageImage, styles.imgHeart]}
          resizeMode="contain"
        />

        {/* Add the rest of your background blobs and shapes here using absolute styling */}
      </View>

      {/* Footer / Main CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/sign-up")}
        >
          <Text style={styles.primaryBtnText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E86673",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  logo: {
    width: 120,
    height: 40,
  },
  signInBtn: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  heroSection: {
    paddingHorizontal: 24,
    marginTop: 32,
    zIndex: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
  },
  collageContainer: {
    flex: 1,
    position: "relative",
    // Helps ensure elements don't bleed out in weird ways on smaller screens
    overflow: "hidden",
  },
  collageImage: {
    position: "absolute",
  },
  /* Responsive absolute positioning strategy: 
    Use percentages for left/right/top/bottom to keep the layout proportional on different devices, 
    rather than hardcoding pixel values.
  */
  imgLeft: {
    width: width * 0.45,
    height: width * 0.45,
    top: "10%",
    left: "-5%",
    zIndex: 2,
  },
  imgRight: {
    width: width * 0.5,
    height: width * 0.5,
    top: "5%",
    right: "-5%",
    zIndex: 2,
  },
  imgCenter: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: "10%",
    alignSelf: "center",
    zIndex: 3,
  },
  imgHeart: {
    width: width * 0.25,
    height: width * 0.25,
    top: "25%",
    alignSelf: "center",
    zIndex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32, // Gives breathing room at the bottom
    zIndex: 10,
  },
  primaryBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // For Android shadow
  },
  primaryBtnText: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "700",
  },
});
