#!/bin/bash
sudo launchctl remove network.mysterium.mysteriumclient
sudo launchctl stop /Library/LaunchDaemons/network.mysterium.mysteriumclient.plist
sudo launchctl unload /Library/LaunchDaemons/network.mysterium.mysteriumclient.plist
sudo rm -rf /Library/LaunchDaemons/network.mysterium.mysteriumclient.plist
sudo killall mysterium_client
