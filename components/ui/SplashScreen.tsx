import React from "react";
import { Image, StatusBar, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        transparent
        backgroundColor="transparent"
      />
      {/* Using a standard Image instead of ImageBackground allows us 
        to apply exact absolute coordinates without layout constraints.
      */}
      <Image
        source={require("@/assets/images/bg-image.png")}
        style={styles.bgImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E86A7A",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bgImage: {
    position: "absolute",
    width: 635.71,
    height: 646.31,

    bottom: 0,
    resizeMode: "contain",
  },
});
