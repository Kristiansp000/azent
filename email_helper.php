<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

function sendEliteEmail($to_email, $subject, $name, $message_content, $order_details = null) {
    $mail = new PHPMailer(true);
    
    // Logika Detail Pesanan dalam HTML
    $itemsHtml = "";
    if ($order_details) {
        $itemsHtml = '<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">';
        $itemsHtml .= '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">';
        foreach ($order_details['items'] as $item) {
            $itemsHtml .= "<tr>
                <td style='padding: 5px 0;'>{$item['name']} (x{$item['qty']})</td>
                <td style='text-align: right;'>Rp " . number_format($item['price'] * $item['qty']) . "</td>
            </tr>";
        }
        $itemsHtml .= "<tr><td colspan='2'><hr style='border: 0; border-top: 1px solid #ddd;'></td></tr>";
        $itemsHtml .= "<tr><strong><td>Total</td><td style='text-align: left;'>Rp " . number_format($order_details['total']) . "</td></strong></tr>";
        $itemsHtml .= '</table></div>';
    }

    $templateHtml = '
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background-color: #f4f4f4; margin: 0; padding: 20px; font-family: "Helvetica", sans-serif; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); color: #333; }
        .header-text { font-size: 22px; font-weight: 800; color: #c5a059; text-align: center; }
        .divider { margin: 20px 0; height: 1px; background: #eee; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 20px; }
        p {font-size: 12px; line-height: 1.6;}
        td {font-size: 9px;}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-text">Warung Elite</div>
        <div class="divider"></div>
        <p>Halo <strong>' . htmlspecialchars($name) . '</strong>,</p>
        <p>' . $message_content . '</p>
        ' . $itemsHtml . '
        <p>Salam hangat,<br><strong>Admin Warung Elite</strong></p>
      </div>
      <div class="footer">&copy; 2026 Warung Elite. IT Support @kristian.</div>
    </body>
    </html>';

    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'warunggelite@gmail.com';
        $mail->Password = 'eqvd hyir biqt evhz'; 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('warunggelite@gmail.com', 'Warung Elite');
        $mail->addAddress($to_email);

        $mail->isHTML(true);
        $mail->Subject = "Warung Elite | " . $subject;
        $mail->Body = $templateHtml;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
}


// Tambahkan di dalam email_helper.php
function sendOTPEmail($to_email, $name, $otp_code) {
    $subject = "Kode OTP Registrasi";
    $message = "Gunakan kode berikut untuk memverifikasi akun Anda:<br><br>";
    $message .= "<span style='font-size: 24px; font-weight: bold; color: #c5a059;'>$otp_code</span><br><br>";
    $message .= "Kode ini akan kadaluarsa dalam 5 menit.";
    
    return sendEliteEmail($to_email, $subject, $name, $message);
}


// Tambahkan di dalam email_helper.php
function sendResetPasswordEmail($to_email, $name, $new_password) {
    $subject = "Reset Password Akun";
    $message = "Kami telah mengatur ulang password Anda sesuai permintaan.<br><br>";
    $message .= "Password baru Anda adalah:<br>";
    $message .= "<span style='font-size: 20px; font-weight: bold; color: #c5a059;'>$new_password</span><br><br>";
    $message .= "Mohon segera ganti password Anda setelah berhasil masuk untuk keamanan.";
    
    return sendEliteEmail($to_email, $subject, $name, $message);
}