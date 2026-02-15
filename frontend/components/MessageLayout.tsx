import React from 'react'

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrontendMessage } from '@/types/frontend/message';

import { Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

import { downloadMediaToDevice } from '@/utils/downloadMediaToDevice';


interface MessageLayoutProps {
    message: FrontendMessage;
    isOwnMessage: boolean;
    isDarkMode?: boolean;
}

const MessageLayout: React.FC<MessageLayoutProps> = ({
    message,
    isOwnMessage,
    isDarkMode = false,
}) => {

    const theme = {
        light: {
            ownBubble: '#DCF8C6',
            otherBubble: '#FFFFFF',
            ownText: '#000000',
            otherText: '#000000',
            timeText: '#666666',
            bubbleShadow: '#00000010',
        },
        dark: {
            ownBubble: '#005C4B',
            otherBubble: '#2A3942',
            ownText: '#FFFFFF',
            otherText: '#E9EDEF',
            timeText: '#A0A0A0',
            bubbleShadow: '#00000030',
        },
    };

    const colors = isDarkMode ? theme.dark : theme.light;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // const renderContent = () => {
    //     return (
    //         <>
    //             {message.senderName && !isOwnMessage && (
    //                 <Text style={styles.senderName}>
    //                     {message.senderName}
    //                 </Text>
    //             )}
    //             <Text style={[styles.messageText, { color: isOwnMessage ? colors.ownText : colors.otherText }]}>
    //                 {message.text}
    //             </Text>
    //         </>
    //     )
    // };

    if (
        (message.type === 'image' || message.type === 'video') &&
        !message.metadata?.url
    ) {
        return null;
    }


    const renderContent = () => {

        // 👤 Sender name (group chats)
        const senderNameBlock =
            message.senderName && !isOwnMessage ? (
                <Text style={styles.senderName}>{message.senderName}</Text>
            ) : null;

        // 🖼️ IMAGE
        if (message.type === 'image') {
            return (
                <>
                    {senderNameBlock}

                    {message.metadata?.url && (
                        // <Image
                        //     source={{ uri: message.metadata?.url }}
                        //     style={styles.image}
                        //     resizeMode="cover"
                        // />
                        <TouchableOpacity
                            onLongPress={() => downloadMediaToDevice(message)}
                        >
                            <Image
                                source={{ uri: message.metadata?.url }}
                                style={{ width: 200, height: 200, borderRadius: 12 }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                    {message.text && (
                        <Text style={[styles.messageText, { color: colors.otherText }]}>
                            {message.text}
                        </Text>
                    )}

                </>
            );
        }

        // 🎥 VIDEO
        if (message.type === 'video') {
            return (
                <>
                    {senderNameBlock}
                    <TouchableOpacity
                        onLongPress={() => downloadMediaToDevice(message)}
                    >
                        <Video
                            source={{ uri: message.metadata?.url }}
                            style={{ width: 240, height: 300 }}
                            resizeMode={ResizeMode.CONTAIN}
                        />
                    </TouchableOpacity>
                    {message.text && (
                        <Text style={[styles.messageText, { color: colors.otherText }]}>
                            {message.text}
                        </Text>
                    )}
                </>
            );
        }

        // 📄 DOCUMENT
        if (message.type === 'document') {
            return (
                <>
                    {senderNameBlock}

                    {message.metadata?.url && (
                        <TouchableOpacity
                            style={styles.documentContainer}
                            // onPress={() => Linking.openURL(message.metadata?.url)}
                            onPress={() => downloadMediaToDevice(message)}
                        >
                            <Ionicons name="document-text-outline" size={22} color="#1971c2" />
                            <View style={{ marginLeft: 8 }}>
                                <Text style={styles.documentName}>
                                    {message?.metadata?.original_name}
                                </Text>
                                <Text style={styles.documentMeta}>
                                    Tap to open
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </>
            );
        }

        // ✏️ TEXT (default)
        return (
            <>
                {senderNameBlock}
                <Text
                    style={[
                        styles.messageText,
                        { color: isOwnMessage ? colors.ownText : colors.otherText },
                    ]}
                >
                    {message.text}
                </Text>
            </>
        );
    };


    return (
        <View>
            <View style={[
                styles.container,
                isOwnMessage ? styles.ownContainer : styles.otherContainer,
            ]}>
                <View
                    style={[
                        styles.bubble,
                        {
                            backgroundColor: isOwnMessage ? colors.ownBubble : colors.otherBubble,
                            shadowColor: colors.bubbleShadow,
                            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                        },
                    ]}
                >
                    {renderContent()}
                    <View style={styles.footer}>
                        <Text style={[styles.timeText, { color: colors.timeText }]}>
                            {formatTime(message.timestamp)}
                        </Text>
                        {isOwnMessage && (
                            <Ionicons
                                name={message.isRead ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={message.isRead ? '#53BDEB' : colors.timeText}
                                style={styles.readIndicator}
                            />
                        )}
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    ownContainer: {
        alignSelf: 'flex-end',
    },
    otherContainer: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: -0.2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    timeText: {
        fontSize: 11,
        marginRight: 4,
    },
    readIndicator: {
        marginLeft: 2,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
        color: '#1FA855', // WhatsApp-ish green
    },
    image: {
        width: 220,
        height: 220,
        borderRadius: 12,
        marginVertical: 4,
    },

    video: {
        width: 240,
        height: 180,
        borderRadius: 12,
        marginVertical: 4,
    },

    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F1F3F5',
        borderRadius: 10,
        marginVertical: 4,
        maxWidth: 240,
    },

    documentName: {
        fontSize: 14,
        fontWeight: '600',
    },

    documentMeta: {
        fontSize: 12,
        color: '#666',
    },

});

export default MessageLayout