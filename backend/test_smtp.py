import smtplib
from email.mime.text import MIMEText

def test_smtp():
    host = 'smtp.gmail.com'
    port = 465
    user = 'official.impacttutors@gmail.com'
    password = 'uvsorcdeaqmowzlt'
    
    print(f"Testing connection to {host}:{port} (SSL)...")
    print(f"User: {user}")
    
    try:
        server = smtplib.SMTP_SSL(host, port, timeout=10)
        print("Connected to server via SSL.")
        
        server.set_debuglevel(1)
        # SSL doesn't need starttls()
        print("TLS started.")
        
        server.login(user, password)
        print("Login successful.")
        
        msg = MIMEText("This is a test email.")
        msg['Subject'] = 'SMTP Test'
        msg['From'] = user
        msg['To'] = user
        
        server.send_message(msg)
        print("Email sent successfully.")
        
        server.quit()
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_smtp()
