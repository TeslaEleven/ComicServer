<?php
header("Connection: close");
ob_start();
phpinfo();
$size = ob_get_length();
header("Content-Length: $size");
ob_end_flush();
flush();
sleep(13);
error_log("do something in the background");
?>
