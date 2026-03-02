import { useState } from 'react';

const REVIEWERS = [
    'Mark@parrishpartners.com',
    'fred.lowder@gmail.com',
    'rich@diveinvestments.com',
    'rmorton@bartnet.net',
    'bpfitzinger1@gmail.com',
    'thickey312@gmail.com',
    'valerie.cuba@gmail.com'
];

interface LoginPromptProps {
    onLogin: (name: string) => void;
}

export function LoginPrompt({ onLogin }: LoginPromptProps) {
    const [selectedName, setSelectedName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedName) {
            onLogin(selectedName);
        }
    };

    return (
        <div className="login-backdrop">
            <div className="login-modal">
                <h2>Who are you?</h2>
                <p>Please select your name to continue reviewing items.</p>
                <form onSubmit={handleSubmit} className="login-form">
                    <select
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        className="login-select"
                        required
                    >
                        <option value="" disabled>Select a reviewer...</option>
                        {REVIEWERS.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn--primary" disabled={!selectedName}>
                        Enter
                    </button>
                </form>
            </div>
        </div>
    );
}
