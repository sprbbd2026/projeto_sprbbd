import LoginForm from "../features/Auth/LoginForm";

export default function RegisterPage() {
    return (
        <main style={{ display: "grid", placeItems: "center", height: "100vh" }}>
            <div>
                <h1>Login</h1>
                <LoginForm />
            </div>
        </main>
    );
}