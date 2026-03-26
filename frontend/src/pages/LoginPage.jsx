import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Trophy, Shield, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('user');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await login(form);
            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-2xl mb-4 shadow-lg shadow-green-900/50">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="text-gray-400 mt-1 text-sm">Sign in to Golf Charity</p>
                </div>

                <div className="card">
                    {/* Role Toggle Strip */}
                    <div className="flex bg-gray-900/80 rounded-lg p-1 mb-8 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                setLoginType('user');
                                setForm({ email: '', password: '' });
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                                loginType === 'user' ? 'bg-gray-800 text-green-400 shadow-lg ring-1 ring-gray-700' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                        >
                            <UserIcon className="w-4 h-4" />
                            User Access
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginType('admin');
                                setForm({ email: 'admin@example.com', password: 'password123' });
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                                loginType === 'admin' ? 'bg-gray-800 text-blue-400 shadow-lg ring-1 ring-gray-700' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            Admin Access
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className="input-field"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Your password"
                                    className="input-field pr-10"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-green-500 hover:text-green-400 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
