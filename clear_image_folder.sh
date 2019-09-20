#!/bin/sh
rm -rf /home/$USER/imageout/public/images/shop
mkdir  /home/$USER/imageout/public/images/shop
chmod 777 /home/$USER/imageout/public/images/shop


rm -rf /home/$USER/imageout/public/images/tmp
mkdir  /home/$USER/imageout/public/images/tmp
chmod 777 /home/$USER/imageout/public/images/tmp
echo "Cleared Disk Space"
echo "Images2 diskspace was cleared. Please verify.." | mail -s "Diskspace cleared on Images2 by CRON" "marcel@catalogs.com,reidl@catalogs.com,juanc@catalogs.comi,richard@catalogs.com" 
