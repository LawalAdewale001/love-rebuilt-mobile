import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";

// Get screen dimensions for responsive absolute positioning
const { width } = Dimensions.get("window");

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Background circles/shapes can be placed absolutely behind everything else */}
      {/* <Image source={require('@/assets/bg-circles.png')} style={styles.bgGraphic} /> */}

      {/* Collage Section taking full height */}
      <View style={styles.collageContainer}>
        {/* Top Left Image */}
        <Image
          source={require("@/assets/couple-left.png")}
          style={[styles.collageImage, styles.imgLeft]}
          resizeMode="contain"
        />

        {/* Right Starburst Image */}
        <Image
          source={require("@/assets/couple-right.png")}
          style={[styles.collageImage, styles.imgRight]}
          resizeMode="contain"
        />

        {/* Center Butterfly Image */}
        <Image
          source={require("@/assets/couple-center.png")}
          style={[styles.collageImage, styles.imgCenter]}
          resizeMode="contain"
        />

        {/* Center Heart */}
        <Image
          source={require("@/assets/heart-center.png")}
          style={[styles.collageImage, styles.imgHeart]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E86673",
  },
  collageContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  collageImage: {
    position: "absolute",
  },
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
});
