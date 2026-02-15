import { WebColors } from '@/constants/theme';
import { CheckCircle, Truck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const theme = WebColors.dark;

export default function VehiculoScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Truck size={64} color={theme.primary} />
                </View>
                <Text style={styles.title}>Estado del Vehículo</Text>

                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <CheckCircle size={24} color={theme.success} />
                        <Text style={styles.statusText}>Operativo</Text>
                    </View>
                    <Text style={styles.description}>
                        Tu vehículo asignado (Ford Transit - 8923JKL) está en condiciones óptimas para realizar entregas.
                    </Text>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Combustible</Text>
                        <Text style={styles.statValue}>75%</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Próxima Rev.</Text>
                        <Text style={styles.statValue}>15 Mar</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${theme.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 32,
    },
    statusCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.cardBorder,
        marginBottom: 24,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.success,
    },
    description: {
        color: theme.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    statRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    statItem: {
        flex: 1,
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
});
