# DigitalOcean Deployment Guide

## 🚀 Deploying Your Lucky Draw App to DigitalOcean

### Option 1: DigitalOcean App Platform (Recommended)

**Pros:**
- ✅ Managed hosting (no server management)
- ✅ Automatic HTTPS
- ✅ WebSocket support
- ✅ Easy GitHub integration
- ✅ Auto-scaling
- ✅ Built-in monitoring

#### Step-by-Step Deployment:

1. **Prepare Your Repository**
   ```bash
   # Make sure your code is committed to GitHub
   git add .
   git commit -m "Prepare for DigitalOcean deployment"
   git push origin main
   ```

2. **Create DigitalOcean Account**
   - Go to [DigitalOcean](https://cloud.digitalocean.com)
   - Sign up for an account
   - Add a payment method (required even for free tier)

3. **Deploy via App Platform**
   - Go to [App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Select your `lucky-draw` repository
   - Choose the `main` branch

4. **Configure Your App**
   - **Name**: `lucky-draw` (or your preferred name)
   - **Type**: Web Service
   - **Source Directory**: `/` (root)
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`

5. **Set Environment Variables**
   Click "Edit" next to your app and add these environment variables:
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3000
   WIFI_SSID=YourWiFiName (optional)
   WIFI_PASSWORD=YourWiFiPassword (optional)
   WIFI_ENCRYPTION=WPA (optional)
   ```

6. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete (5-10 minutes)
   - Your app will be available at `https://your-app-name.ondigitalocean.app`

### Option 2: DigitalOcean Droplet (VPS)

**Pros:**
- ✅ Full control over server
- ✅ Lower cost for long-term use
- ✅ Can run multiple apps

#### Step-by-Step Deployment:

1. **Create a Droplet**
   - Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
   - Click "Create Droplet"
   - Choose Ubuntu 22.04 LTS
   - Select Basic plan ($6/month minimum)
   - Add SSH key for security

2. **Connect to Your Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

5. **Deploy Your App**
   ```bash
   # Clone your repository
   git clone https://github.com/your-username/lucky-draw.git
   cd lucky-draw
   
   # Install dependencies
   npm install
   
   # Start with PM2
   pm2 start index.js --name "lucky-draw"
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx (Reverse Proxy)**
   ```bash
   # Install Nginx
   apt install nginx -y
   
   # Create configuration
   nano /etc/nginx/sites-available/lucky-draw
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable the site
   ln -s /etc/nginx/sites-available/lucky-draw /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

7. **Set up SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   certbot --nginx -d your-domain.com
   ```

## 🔧 Configuration

### Environment Variables

Set these in your DigitalOcean dashboard (App Platform) or on your Droplet:

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
WIFI_SSID=YourWiFiName
WIFI_PASSWORD=YourWiFiPassword
WIFI_ENCRYPTION=WPA
```

### Domain Configuration (Optional)

1. **Buy a domain** from DigitalOcean or any registrar
2. **Point DNS** to your DigitalOcean app/droplet
3. **Update your app** to use the custom domain

## 📱 Access Your Deployed App

Once deployed, you can access:

- **Main App**: `https://your-app.ondigitalocean.app`
- **Live Monitor**: `https://your-app.ondigitalocean.app/monitor`
- **QR Code**: `https://your-app.ondigitalocean.app/qr`
- **WiFi QR**: `https://your-app.ondigitalocean.app/wifi`

## 🔍 Monitoring & Maintenance

### App Platform
- Built-in monitoring dashboard
- Automatic scaling
- Easy environment variable management
- One-click deployments

### Droplet
```bash
# Check app status
pm2 status

# View logs
pm2 logs lucky-draw

# Restart app
pm2 restart lucky-draw

# Update app
git pull origin main
npm install
pm2 restart lucky-draw
```

## 💰 Cost Estimation

### App Platform
- **Basic Plan**: $5/month (512MB RAM, 1 vCPU)
- **Professional Plan**: $12/month (1GB RAM, 1 vCPU)
- **Free tier**: Available for static sites only

### Droplet
- **Basic Droplet**: $6/month (1GB RAM, 1 vCPU)
- **Additional storage**: $0.10/GB/month
- **Bandwidth**: 1TB included

## 🚨 Troubleshooting

### Common Issues:

1. **WebSocket not working**
   - Ensure your platform supports WebSocket
   - Check proxy configuration for Nginx

2. **Environment variables not loading**
   - Verify variables are set in DigitalOcean dashboard
   - Restart your app after changing variables

3. **App not starting**
   - Check logs: `pm2 logs lucky-draw` (Droplet) or App Platform logs
   - Verify all dependencies are installed

4. **HTTPS issues**
   - Ensure SSL certificate is properly configured
   - Check domain DNS settings

## 🎯 Next Steps

1. **Test your deployment** with multiple devices
2. **Set up monitoring** for production use
3. **Configure backups** (for Droplet option)
4. **Set up domain** for easier access
5. **Monitor usage** and scale as needed

Your lucky draw app with live monitoring is now ready for production use! 🎉
