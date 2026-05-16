def analyze_impact(pr_diff):

    pr_diff = pr_diff.lower()

    impacted_files = []

    # Authentication systems

    if "auth" in pr_diff or "token" in pr_diff:

        impacted_files.extend([
            "auth.py",
            "user_session.py",
            "jwt_handler.py"
        ])

    # Payment systems

    if "payment" in pr_diff or "invoice" in pr_diff:

        impacted_files.extend([
            "payment_service.py",
            "invoice_system.py",
            "billing_controller.py"
        ])

    # Database systems

    if "database" in pr_diff or "sql" in pr_diff:

        impacted_files.extend([
            "database_connector.py",
            "migration_service.py",
            "query_engine.py"
        ])

    # Frontend/UI systems

    if "ui" in pr_diff or "frontend" in pr_diff:

        impacted_files.extend([
            "dashboard.jsx",
            "navbar.jsx",
            "settings_modal.jsx"
        ])

    # API systems

    if "api" in pr_diff:

        impacted_files.extend([
            "api_gateway.py",
            "request_handler.py",
            "response_parser.py"
        ])

    # Security systems

    if "security" in pr_diff or "admin" in pr_diff:

        impacted_files.extend([
            "security_manager.py",
            "admin_controller.py",
            "permission_handler.py"
        ])

    # Default fallback

    if not impacted_files:

        impacted_files = [
            "main_service.py",
            "config_loader.py"
        ]

    # Remove duplicates

    impacted_files = list(set(impacted_files))

    return impacted_files