// Screen Wrapper Component with Safe Area and consistent styling
import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ViewStyle,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface ScreenWrapperProps {
    children: React.ReactNode;
    scrollable?: boolean;
    padded?: boolean;
    style?: ViewStyle;
    contentContainerStyle?: ViewStyle;
    keyboardAvoiding?: boolean;
    safeArea?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    statusBarStyle?: 'light-content' | 'dark-content';
    backgroundColor?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    scrollable = false,
    padded = true,
    style,
    contentContainerStyle,
    keyboardAvoiding = true,
    safeArea = true,
    refreshing = false,
    onRefresh,
    statusBarStyle = 'light-content',
    backgroundColor = Colors.background.primary,
}) => {
    const containerStyle: ViewStyle[] = [
        styles.container,
        { backgroundColor },
        style as ViewStyle,
    ].filter(Boolean) as ViewStyle[];

    const contentStyle: ViewStyle[] = [
        padded && styles.padded,
        contentContainerStyle,
    ].filter(Boolean) as ViewStyle[];

    const renderContent = () => {
        if (scrollable) {
            return (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, ...contentStyle]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={Colors.primary.main}
                                colors={[Colors.primary.main]}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            );
        }

        return <View style={[styles.content, ...contentStyle]}>{children}</View>;
    };

    const renderWithKeyboardAvoiding = () => {
        if (keyboardAvoiding) {
            return (
                <KeyboardAvoidingView
                    style={styles.keyboardAvoiding}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {renderContent()}
                </KeyboardAvoidingView>
            );
        }

        return renderContent();
    };

    return (
        <>
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor={backgroundColor}
                translucent={false}
            />
            {safeArea ? (
                <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
                    {renderWithKeyboardAvoiding()}
                </SafeAreaView>
            ) : (
                <View style={containerStyle}>{renderWithKeyboardAvoiding()}</View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
    },
    padded: {
        paddingHorizontal: Layout.spacing.md,
    },
});
