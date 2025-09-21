import React from "react";
import LoginForm from "../components/LoginForm";

const LoginPage: React.FC = () => {
	return (
		<div className="login-page">
			<div className="page-content">
				<LoginForm />
			</div>
		</div>
	);
};

export default LoginPage;
