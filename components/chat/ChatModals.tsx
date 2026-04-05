/**
 * ChatModals — all modals and bottom sheets for the chat conversation screen.
 * Includes: full-screen image, delete confirmation, forward, questionnaire,
 * and the leave/block/report/joinGroup/planMeetup bottom sheets.
 */

import { DualStarburstFrame } from "@/components/ui/chat-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, ScrollView, Text, VStack } from "@gluestack-ui/themed";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponderInstance,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { PRIMARY_COLOR } from "@/constants/theme";
import type { ChatMessage, SheetType } from "@/types/chat.types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONNECTION_OPTIONS = ["Casual chat", "Getting Serious", "Dating", "Exclusive"];

interface ChatModalsProps {
  name: string;
  isGroup: boolean;

  // Full-screen image
  fullScreenImage: string | null;
  onCloseFullScreenImage: () => void;

  // Delete
  deleteMsg: ChatMessage | null;
  onCloseDeleteMsg: () => void;
  onDeleteForMe: (msg: ChatMessage) => void;
  onDeleteForEveryone: (msg: ChatMessage) => void;

  // Forward
  forwardMsg: ChatMessage | null;
  onCloseForwardMsg: () => void;

  // Questionnaire
  showQuestionnaire: boolean;
  questionnaireStep: "question" | "success";
  setQuestionnaireStep: (step: "question" | "success") => void;
  selectedOptions: string[];
  toggleOption: (opt: string) => void;
  onSubmitQuestionnaire: () => void;
  onCloseQuestionnaire: () => void;
  slideAnim: Animated.Value;
  panResponder: PanResponderInstance;

  // Generic sheets
  activeSheet: SheetType;
  onCloseSheet: () => void;
  reportStep: "form" | "success";
  setReportStep: (step: "form" | "success") => void;
  reportText: string;
  setReportText: (t: string) => void;
  meetupStep: "form" | "success";
  setMeetupStep: (step: "form" | "success") => void;
  meetupTitle: string;
  setMeetupTitle: (t: string) => void;
  meetupLocation: string;
  setMeetupLocation: (t: string) => void;
  meetupDate: Date | null;
  setMeetupDate: (d: Date | null) => void;
  meetupTime: Date | null;
  setMeetupTime: (t: Date | null) => void;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
  sheetAnim: Animated.Value;
  sheetPanResponder: PanResponderInstance;

  // Group details for Join modal
  groupImage?: string | null;
  groupDescription?: string | null;
  totalMembers?: number;
  membersNames?: string[];
  membersAvatars?: string[];
  isMember?: boolean;
  onJoinGroup?: () => void;
  isJoiningGroup?: boolean;

  // New props for Block / Report
  onBlock?: () => void;
  onReport?: (text: string) => void;
  isBlocking?: boolean;
  isUnblocking?: boolean;
  isReporting?: boolean;
  isDeleting?: boolean;
  onLeaveGroup?: () => void;
  isLeavingGroup?: boolean;
}

// ─── Drag handle sub-component ───────────────────────────────────────────────

function DragHandle({ color = "rgba(255,255,255,0.5)", panHandlers }: { color?: string; panHandlers?: any }) {
  return (
    <Box {...panHandlers} alignItems="center" pt="$4" pb="$4">
      <Box w={40} h={5} borderRadius={3} bg={color} />
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatModals({
  name,
  isGroup,
  fullScreenImage,
  onCloseFullScreenImage,
  deleteMsg,
  onCloseDeleteMsg,
  onDeleteForMe,
  onDeleteForEveryone,
  forwardMsg,
  onCloseForwardMsg,
  showQuestionnaire,
  questionnaireStep,
  selectedOptions,
  toggleOption,
  onSubmitQuestionnaire,
  onCloseQuestionnaire,
  slideAnim,
  panResponder,
  activeSheet,
  onCloseSheet,
  reportStep,
  setReportStep,
  reportText,
  setReportText,
  meetupStep,
  meetupTitle,
  setMeetupTitle,
  meetupLocation,
  setMeetupLocation,
  meetupDate,
  setMeetupDate,
  meetupTime,
  setMeetupTime,
  showDatePicker,
  setShowDatePicker,
  showTimePicker,
  setShowTimePicker,
  sheetAnim,
  sheetPanResponder,
  onBlock,
  onReport,
  isBlocking,
  isUnblocking,
  isReporting,
  isDeleting,
  groupImage,
  groupDescription,
  totalMembers = 0,
  membersNames = [],
  membersAvatars = [],
  isMember = true,
  onJoinGroup,
  isJoiningGroup,
  onLeaveGroup,
  isLeavingGroup,
}: ChatModalsProps) {
  const isAnyActionInProgress = isBlocking || isUnblocking || isReporting || isDeleting || isJoiningGroup || isLeavingGroup;
  return (
    <>
      {/* ── Full-screen image viewer ── */}
      <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={onCloseFullScreenImage}>
        <TouchableWithoutFeedback onPress={onCloseFullScreenImage}>
          <Box flex={1} bg="rgba(0,0,0,0.92)" justifyContent="center" alignItems="center">
            {fullScreenImage && (
              <Image source={{ uri: fullScreenImage }} style={{ width: "100%", height: "80%" }} contentFit="contain" />
            )}
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal visible={!!deleteMsg} transparent animationType="fade" onRequestClose={onCloseDeleteMsg}>
        <TouchableWithoutFeedback onPress={onCloseDeleteMsg}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" alignItems="center">
            <TouchableWithoutFeedback>
              <Box bg="#FFFFFF" borderRadius={16} p="$5" mx="$6" w="85%" maxWidth={320}>
                <Text fontSize={16} fontWeight="$bold" color="#1A1A1A" mb="$4">Delete message?</Text>

                {deleteMsg?.sent && (
                  <Pressable borderWidth={1} borderColor={PRIMARY_COLOR} borderRadius={24} py="$2.5"
                    alignItems="center" mb="$3"
                    onPress={() => deleteMsg && onDeleteForEveryone(deleteMsg)}
                    disabled={isAnyActionInProgress}
                    opacity={isAnyActionInProgress ? 0.6 : 1}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    ) : (
                      <Text fontSize={14} fontWeight="$semibold" color={PRIMARY_COLOR}>Delete for everyone</Text>
                    )}
                  </Pressable>
                )}
 
                <Pressable borderWidth={1} borderColor={PRIMARY_COLOR} borderRadius={24} py="$2.5"
                  alignItems="center" mb="$3"
                  onPress={() => deleteMsg && onDeleteForMe(deleteMsg)}
                  disabled={isAnyActionInProgress}
                  opacity={isAnyActionInProgress ? 0.6 : 1}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  ) : (
                    <Text fontSize={14} fontWeight="$semibold" color={PRIMARY_COLOR}>Delete for me</Text>
                  )}
                </Pressable>
 
                <Pressable py="$2.5" alignItems="center" onPress={onCloseDeleteMsg} disabled={isAnyActionInProgress}>
                  <Text fontSize={14} fontWeight="$semibold" color="#999999">Cancel</Text>
                </Pressable>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Forward message ── */}
      <Modal visible={!!forwardMsg} transparent animationType="fade" onRequestClose={onCloseForwardMsg}>
        <TouchableWithoutFeedback onPress={onCloseForwardMsg}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Box bg="#FFFFFF" borderTopLeftRadius={24} borderTopRightRadius={24}
                pb="$6" pt="$4" px="$5" maxHeight={SCREEN_HEIGHT * 0.5}
              >
                <Text fontSize={18} fontWeight="$bold" color="#1A1A1A" mb="$1">Forward to</Text>
                <Text fontSize={13} color="#999999" mb="$4">Select a chat to forward the message</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {["Patrica", "Princess", "Football Lovers", "Juliet", "Foodies"].map((contact) => (
                    <Pressable key={contact}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCloseForwardMsg(); }}
                      py="$3" borderBottomWidth={1} borderBottomColor="#F4F3F2"
                    >
                      <HStack alignItems="center" space="md">
                        <Box w={36} h={36} borderRadius={18} bg="#F0C4C8" justifyContent="center" alignItems="center">
                          <MaterialIcons name="person" size={20} color={PRIMARY_COLOR} />
                        </Box>
                        <Text fontSize={15} color="#1A1A1A" flex={1}>{contact}</Text>
                        <MaterialIcons name="send" size={18} color={PRIMARY_COLOR} />
                      </HStack>
                    </Pressable>
                  ))}
                </ScrollView>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Questionnaire bottom sheet ── */}
      <Modal visible={showQuestionnaire} transparent animationType="none" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={onCloseQuestionnaire}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                <Box bg={PRIMARY_COLOR} borderTopLeftRadius={24} borderTopRightRadius={24} px="$6" pt="$0" pb="$8">
                  <DragHandle panHandlers={panResponder.panHandlers} />

                  {questionnaireStep === "question" ? (
                    <>
                      <Box alignItems="center" mb="$4">
                        <DualStarburstFrame width={310} height={210}
                          leftImageUri="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=top"
                          rightImageUri="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=top"
                        />
                      </Box>
                      <Text fontSize={20} fontWeight="$bold" color="#FFFFFF" textAlign="center" mb="$1">
                        How is your connection going?
                      </Text>
                      <Text fontSize={14} color="rgba(255,255,255,0.8)" textAlign="center" mb="$5">
                        Select your preferred answer
                      </Text>
                      <HStack flexWrap="wrap" justifyContent="center" mb="$6" gap={10}>
                        {CONNECTION_OPTIONS.map((option) => {
                          const isSelected = selectedOptions.includes(option);
                          return (
                            <Pressable key={option} onPress={() => toggleOption(option)}
                              borderWidth={1.5} borderColor="#FFFFFF" borderRadius={20} px="$4" py="$2"
                              bg={isSelected ? "#FFFFFF" : "transparent"}
                            >
                              <Text fontSize={14} fontWeight="$medium" color={isSelected ? PRIMARY_COLOR : "#FFFFFF"}>
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </HStack>
                      <Pressable
                        bg={selectedOptions.length > 0 ? "#FFFFFF" : "rgba(255,255,255,0.4)"}
                        borderRadius={28} py="$3" alignItems="center" mb="$3"
                        onPress={selectedOptions.length > 0 ? onSubmitQuestionnaire : undefined}
                      >
                        <Text fontSize={16} fontWeight="$semibold"
                          color={selectedOptions.length > 0 ? PRIMARY_COLOR : "rgba(255,255,255,0.6)"}
                        >Submit</Text>
                      </Pressable>
                      <Pressable borderWidth={1.5} borderColor="#FFFFFF" borderRadius={28} py="$3"
                        alignItems="center" onPress={onCloseQuestionnaire}
                      >
                        <Text fontSize={16} fontWeight="$semibold" color="#FFFFFF">Cancel</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Box alignItems="center" mb="$4">
                        <DualStarburstFrame width={310} height={210}
                          leftImageUri="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=top"
                          rightImageUri="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=top"
                        />
                      </Box>
                      <Text fontSize={20} fontWeight="$bold" color="#FFFFFF" textAlign="center" mb="$6">
                        Keep up the conversation
                      </Text>
                      <Pressable bg="#FFFFFF" borderRadius={28} py="$3" alignItems="center" onPress={onCloseQuestionnaire}>
                        <Text fontSize={16} fontWeight="$semibold" color="#1A1A1A">Continue your Conversation</Text>
                      </Pressable>
                    </>
                  )}
                </Box>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Generic bottom sheets (leave / block / report / join / meetup) ── */}
      <Modal visible={!!activeSheet} transparent animationType="none" statusBarTranslucent
        onRequestClose={() => {
          if (activeSheet === "joinGroup" && !isMember) return;
          onCloseSheet();
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          if (activeSheet === "joinGroup" && !isMember) return;
          onCloseSheet();
        }}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Animated.View style={{ transform: [{ translateY: sheetAnim }] }}>

                {/* Leave Group */}
                {activeSheet === "leave" && (
                  <Box bg={PRIMARY_COLOR} borderTopLeftRadius={24} borderTopRightRadius={24} px="$6" pb="$8">
                    <DragHandle panHandlers={sheetPanResponder.panHandlers} />
                    <Text fontSize={20} fontWeight="$bold" color="#FFFFFF" textAlign="center" mb="$6" px="$2">
                      Are you sure you want to{"\n"}exit {name} group?
                    </Text>
                    <Pressable borderWidth={1.5} borderColor="#FFFFFF" borderRadius={28} py="$3"
                      alignItems="center" mb="$3" 
                      onPress={() => onLeaveGroup?.()}
                      disabled={isAnyActionInProgress}
                      opacity={isAnyActionInProgress ? 0.6 : 1}
                    >
                      {isLeavingGroup ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text fontSize={16} fontWeight="$semibold" color="#FFFFFF">Yes</Text>
                      )}
                    </Pressable>
                    <Pressable bg="#FFFFFF" borderRadius={28} py="$3" alignItems="center" onPress={onCloseSheet}
                      disabled={isAnyActionInProgress}
                      opacity={isAnyActionInProgress ? 0.6 : 1}
                    >
                      <Text fontSize={16} fontWeight="$bold" color="#1A1A1A">No</Text>
                    </Pressable>
                  </Box>
                )}

                {/* Block */}
                {activeSheet === "block" && (
                  <Box bg={PRIMARY_COLOR} borderTopLeftRadius={24} borderTopRightRadius={24} px="$6" pb="$8">
                    <DragHandle panHandlers={sheetPanResponder.panHandlers} />
                    <Text fontSize={20} fontWeight="$bold" color="#FFFFFF" textAlign="center" mb="$2" px="$2">
                      Are you sure you want to{"\n"}block {name}?
                    </Text>
                    <Text fontSize={14} color="rgba(255,255,255,0.8)" textAlign="center" mb="$6">
                      You will loose your love rate progress, if{"\n"}you proceed.
                    </Text>
                    <Pressable borderWidth={1.5} borderColor="#FFFFFF" borderRadius={28} py="$3"
                      alignItems="center" mb="$3" 
                      onPress={() => {
                        if (onBlock) onBlock();
                        // Note: we don't close sheet here so user sees the progress
                      }}
                      disabled={isAnyActionInProgress}
                      opacity={isAnyActionInProgress ? 0.6 : 1}
                    >
                      {isBlocking ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text fontSize={16} fontWeight="$semibold" color="#FFFFFF">Yes</Text>
                      )}
                    </Pressable>
                    <Pressable bg="#FFFFFF" borderRadius={28} py="$3" alignItems="center" onPress={onCloseSheet} disabled={isAnyActionInProgress}>
                      <Text fontSize={16} fontWeight="$bold" color="#1A1A1A">No</Text>
                    </Pressable>
                  </Box>
                )}

                {/* Report — form */}
                {activeSheet === "report" && reportStep === "form" && (
                  <Box bg="#FFFFFF" borderTopLeftRadius={24} borderTopRightRadius={24} pb="$6">
                    <DragHandle color="#CCCCCC" panHandlers={sheetPanResponder.panHandlers} />
                    <Box px="$6" pt="$1">
                      <Text fontSize={20} fontWeight="$bold" color="#1A1A1A" mb="$1">Report {name}</Text>
                      <Text fontSize={14} color="#999999" mb="$5">Type out your report</Text>
                      <Box borderWidth={1} borderColor="#E0E0E0" borderRadius={12} p="$4" mb="$6" bg="#F5F3F0" minHeight={150}>
                        <TextInput value={reportText} onChangeText={setReportText} multiline
                          style={{ fontSize: 15, color: "#1A1A1A", minHeight: 110, textAlignVertical: "top" }}
                          placeholder="State your report" placeholderTextColor="#999999"
                          editable={!isAnyActionInProgress}
                        />
                      </Box>
                      <Pressable bg={reportText.trim() && !isAnyActionInProgress ? PRIMARY_COLOR : "#F5F3F0"} borderRadius={28} py="$3"
                        alignItems="center" mb="$3"
                        onPress={() => {
                          if (reportText.trim() && onReport) {
                            onReport(reportText.trim());
                          }
                        }}
                        disabled={!reportText.trim() || isAnyActionInProgress}
                      >
                        {isReporting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text fontSize={16} fontWeight="$bold" color={reportText.trim() ? "#FFFFFF" : "#CCCCCC"}>Submit Report</Text>
                        )}
                      </Pressable>
                      <Pressable borderWidth={1.5} borderColor="#1A1A1A" borderRadius={28} py="$3"
                        alignItems="center" onPress={onCloseSheet} disabled={isAnyActionInProgress}
                      >
                        <Text fontSize={16} fontWeight="$bold" color="#1A1A1A">Cancel</Text>
                      </Pressable>
                    </Box>
                  </Box>
                )}

                {/* Report — success */}
                {activeSheet === "report" && reportStep === "success" && (
                  <Box bg={PRIMARY_COLOR} borderTopLeftRadius={24} borderTopRightRadius={24} px="$6" pb="$8">
                    <DragHandle panHandlers={sheetPanResponder.panHandlers} />
                    <Box alignItems="center" mb="$4">
                      <Image source={require("@/assets/images/two-hearts.png")}
                        style={{ width: 180, height: 160 }} contentFit="contain"
                      />
                    </Box>
                    <Text fontSize={22} fontWeight="$bold" color="#FFFFFF" textAlign="center" mb="$2">Report Sent</Text>
                    <Text fontSize={14} color="rgba(255,255,255,0.8)" textAlign="center" mb="$6">
                      Our support team will look into the situation
                    </Text>
                    <Pressable borderWidth={1.5} borderColor="#FFFFFF" borderRadius={28} py="$3"
                      alignItems="center" onPress={onCloseSheet}
                    >
                      <Text fontSize={16} fontWeight="$semibold" color="#FFFFFF">Cancel</Text>
                    </Pressable>
                  </Box>
                )}

                {/* Plan Meetup — form */}
                {activeSheet === "planMeetup" && meetupStep === "form" && (
                  <Box bg="#FFFFFF" borderTopLeftRadius={24} borderTopRightRadius={24} pb="$6">
                    <DragHandle color="#CCCCCC" panHandlers={sheetPanResponder.panHandlers} />
                    <Box px="$6" pt="$1">
                      <Text fontSize={20} fontWeight="$bold" color="#1A1A1A" mb="$1">Plan a Meeting</Text>
                      <Text fontSize={14} color="#999999" mb="$5">Provide the details of meetup</Text>

                      <Box borderWidth={1} borderColor="#E0E0E0" borderRadius={12} p="$3" mb="$3" bg="#F5F3F0">
                        {meetupTitle ? <Text fontSize={11} color="#999999" mb="$0.5">Title of meetup</Text> : null}
                        <TextInput value={meetupTitle} onChangeText={setMeetupTitle}
                          style={{ fontSize: 15, color: "#1A1A1A" }}
                          placeholder="Title of meetup" placeholderTextColor="#999999"
                        />
                      </Box>

                      <Box borderWidth={1} borderColor="#E0E0E0" borderRadius={12} p="$3" mb="$3" bg="#F5F3F0">
                        {meetupLocation ? <Text fontSize={11} color="#999999" mb="$0.5">Location</Text> : null}
                        <TextInput value={meetupLocation} onChangeText={setMeetupLocation}
                          style={{ fontSize: 15, color: "#1A1A1A" }}
                          placeholder="Location" placeholderTextColor="#999999"
                        />
                      </Box>

                      <HStack space="md" mb="$6">
                        <Pressable flex={1} borderWidth={1} borderColor="#E0E0E0" borderRadius={12}
                          p="$3" bg="#F5F3F0" onPress={() => setShowDatePicker(true)}
                        >
                          {meetupDate ? <Text fontSize={11} color="#999999" mb="$0.5">Date</Text> : null}
                          <Text fontSize={15} color={meetupDate ? "#1A1A1A" : "#999999"}>
                            {meetupDate ? meetupDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date"}
                          </Text>
                        </Pressable>
                        <Pressable flex={1} borderWidth={1} borderColor="#E0E0E0" borderRadius={12}
                          p="$3" bg="#F5F3F0" onPress={() => setShowTimePicker(true)}
                        >
                          {meetupTime ? <Text fontSize={11} color="#999999" mb="$0.5">Time</Text> : null}
                          <Text fontSize={15} color={meetupTime ? "#1A1A1A" : "#999999"}>
                            {meetupTime ? meetupTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "Time"}
                          </Text>
                        </Pressable>
                      </HStack>

                      {showDatePicker && (
                        <DateTimePicker value={meetupDate || new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={(_: DateTimePickerEvent, date?: Date) => { setShowDatePicker(false); if (date) setMeetupDate(date); }}
                        />
                      )}
                      {showTimePicker && (
                        <DateTimePicker value={meetupTime || new Date()} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={(_: DateTimePickerEvent, time?: Date) => { setShowTimePicker(false); if (time) setMeetupTime(time); }}
                        />
                      )}

                      <Pressable
                        bg={meetupTitle && meetupLocation && meetupDate && meetupTime ? PRIMARY_COLOR : "#F5F3F0"}
                        borderRadius={28} py="$3" alignItems="center" mb="$3"
                        onPress={meetupTitle && meetupLocation && meetupDate && meetupTime ? onCloseSheet : undefined}
                      >
                        <Text fontSize={16} fontWeight="$bold"
                          color={meetupTitle && meetupLocation && meetupDate && meetupTime ? "#FFFFFF" : "#CCCCCC"}
                        >Send Meetup</Text>
                      </Pressable>
                      <Pressable borderWidth={1.5} borderColor="#1A1A1A" borderRadius={28} py="$3"
                        alignItems="center" onPress={onCloseSheet}
                      >
                        <Text fontSize={16} fontWeight="$bold" color="#1A1A1A">Cancel</Text>
                      </Pressable>
                    </Box>
                  </Box>
                )}

                {/* Join Group */}
                {activeSheet === "joinGroup" && (
                  <Box bg="#E86A7A" borderTopLeftRadius={40} borderTopRightRadius={40} px="$6" pb="$12" pt="$4">
                    {!isMember && <Box h={10} />}
                    {isMember && <DragHandle panHandlers={sheetPanResponder.panHandlers} />}
                    
                    <VStack alignItems="center" space="md" mb="$6">
                      <Box mb="$2">
                        {/* Use a flower-like or curvy starburst frame for the group image */}
                        <Box 
                          bg="#FFFFFF" 
                          p="$1" 
                          borderRadius={70} 
                          shadowColor="#000" 
                          shadowOffset={{ width: 0, height: 4 }} 
                          shadowOpacity={0.1} 
                          shadowRadius={8} 
                          elevation={5}
                        >
                          <Image
                            source={{ uri: groupImage || "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=300" }} 
                            style={{ width: 120, height: 120, borderRadius: 60 }} 
                            contentFit="cover"
                          />
                        </Box>
                      </Box>
 
                      <Text fontSize={22} fontWeight="$bold" color="#FFFFFF" textAlign="center" mt="$2" numberOfLines={1} ellipsizeMode="tail" px="$4">
                        {name}
                      </Text>
                      
                      <Text fontSize={15} color="rgba(255,255,255,0.9)" textAlign="center" px="$4" lineHeight={22}>
                        {groupDescription || `A group where ${name.toLowerCase()} is discussed and love is found.`}
                      </Text>
 
                      <HStack alignItems="center" space="xs" mt="$2">
                        <HStack space="xs" mr="$2">
                          {(membersAvatars.length > 0 ? membersAvatars.slice(0, 3) : [1, 2, 3]).map((avatar, idx) => (
                            <Box key={idx} w={32} h={32} borderRadius={16} borderWidth={2} borderColor="#FFFFFF" overflow="hidden" ml={idx === 0 ? 0 : -10} bg="#F0C4C8">
                              {typeof avatar === "string" ? (
                                <Image 
                                  source={{ uri: avatar }} 
                                  style={{ width: "100%", height: "100%" }}
                                />
                              ) : (
                                <Box flex={1} justifyContent="center" alignItems="center">
                                  <MaterialIcons name="person" size={16} color="#FFFFFF" />
                                </Box>
                              )}
                            </Box>
                          ))}
                        </HStack>
                        <Text fontSize={15} fontWeight="$semibold" color="#FFFFFF">
                          {totalMembers > 0 ? (
                            `+${totalMembers > 3 ? totalMembers - 3 : 0} ${membersNames.length > 0 ? membersNames[0] : "Everyone"} is here`
                          ) : (
                            "Be the first to join!"
                          )}
                        </Text>
                      </HStack>
                    </VStack>

                    <Pressable 
                      bg="#FFFFFF" 
                      borderRadius={28} 
                      py="$4"
                      alignItems="center" 
                      mb="$3" 
                      onPress={onJoinGroup}
                      disabled={isJoiningGroup}
                    >
                      {isJoiningGroup ? (
                        <ActivityIndicator size="small" color="#E86A7A" />
                      ) : (
                        <Text fontSize={18} fontWeight="$bold" color="#E86A7A">Join {name}</Text>
                      )}
                    </Pressable>
                    
                    {!isMember && (
                      <Pressable py="$2" alignItems="center" onPress={() => onCloseSheet()}>
                         <Text fontSize={14} color="rgba(255,255,255,0.7)">Go back</Text>
                      </Pressable>
                    )}
                  </Box>
                )}

              </Animated.View>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
