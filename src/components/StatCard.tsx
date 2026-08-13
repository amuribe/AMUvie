import './styles/StatCard.css';
interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    // For things like the / 10 in ratings
    suffix?: string;
}

export default function StatCard({ icon, label, value, suffix}: StatCardProps) {
    return (
        <div className="stat-card">
                    <div>
                        <span className="stat-card-icon">{icon}</span>
                    </div>

                    <div className="stat-card-content">
                        <span className="stat-card-label">{label}</span>

                        <strong className="stat-card-value">
                            {value}
                            {suffix && <small>{suffix}</small>}
                        </strong>
                    </div>
                </div>
    );
}