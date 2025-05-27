from app import create_app

app = create_app('development')

if __name__ == '__main__':
    print("Flask server starting...")
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.methods} {rule}")
    app.run(host='0.0.0.0', port=5050, debug=True)

