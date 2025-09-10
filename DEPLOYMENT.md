# Deployment Guide

This guide will walk you through deploying the Chat Parser App to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **GitHub Account**: For version control and easy deployment

## Step 1: Prepare Your Repository

1. Initialize git in your project:
```bash
git init
git add .
git commit -m "Initial commit: Chat Parser App"
```

2. Create a new repository on GitHub and push your code:
```bash
git remote add origin https://github.com/yourusername/chat-parser.git
git branch -M main
git push -u origin main
```

## Step 2: Set up MongoDB Database

You have several options for MongoDB hosting:

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Choose a cloud provider and region
5. Create a database user
6. Get your connection string

### Option B: Local MongoDB (Development)
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/chat_parser`

### Option C: Other MongoDB Hosting Services
- Railway
- MongoDB Atlas
- DigitalOcean Managed MongoDB
- AWS DocumentDB

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Click **Deploy**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to link your project

## Step 4: Configure Environment Variables

After deployment, you need to add environment variables:

1. Go to your project in Vercel Dashboard
2. Click on **Settings** tab
3. Click **Environment Variables**
4. Add the following variables:

### Required Variables:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Database Variables (MongoDB):

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat_parser
MONGODB_DATABASE=chat_parser
```

### How to get MongoDB Variables:

1. Go to your MongoDB Atlas dashboard
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string and replace `<password>` with your database user password
5. Set `MONGODB_DATABASE` to your desired database name (default: `chat_parser`)

## Step 5: Redeploy

After adding environment variables:

1. Go to **Deployments** tab in your Vercel project
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**

Or trigger a new deployment by pushing to your main branch:
```bash
git add .
git commit -m "Add environment variables"
git push
```

## Step 6: Test Your Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Try uploading the sample chat file (`sample-chat.txt`)
3. Verify that messages are extracted and stored correctly

## Troubleshooting

### Common Issues:

1. **"OpenAI API key not configured"**
   - Ensure `OPENAI_API_KEY` is set in Vercel environment variables
   - Redeploy after adding the variable

2. **Database connection errors**
   - Verify MongoDB URI is correct and accessible
   - Check that your MongoDB cluster is active
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Verify database user credentials are correct

3. **Build failures**
   - Check the build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

4. **File upload not working**
   - Check that the `/api/upload` route is accessible
   - Verify file size limits (Vercel has a 4.5MB limit for serverless functions)
   - Check function timeout settings

### Vercel Function Limits:

- **Memory**: 1024MB
- **Execution Time**: 10 seconds (Hobby), 60 seconds (Pro)
- **Request Size**: 4.5MB
- **Response Size**: 4.5MB

## Production Optimizations

1. **Enable Edge Functions** (if applicable)
2. **Set up custom domain** in Vercel settings
3. **Configure caching** for static assets
4. **Set up monitoring** with Vercel Analytics
5. **Enable preview deployments** for testing

## Security Checklist

- [ ] OpenAI API key is stored securely in environment variables
- [ ] Database credentials are not exposed in client-side code
- [ ] File upload validation is working
- [ ] Rate limiting is implemented (consider adding)
- [ ] CORS is properly configured

## Monitoring

1. **Vercel Analytics**: Monitor performance and usage
2. **Function Logs**: Check for errors in Vercel dashboard
3. **Database Monitoring**: Monitor MongoDB usage and performance
4. **OpenAI Usage**: Monitor API usage and costs

## Cost Considerations

- **Vercel Hobby Plan**: Free for personal projects
- **Vercel Pro Plan**: $20/month for production use
- **MongoDB Atlas**: Free tier available, usage-based pricing for higher tiers
- **OpenAI API**: Pay-per-use based on tokens

## Next Steps

After successful deployment:

1. Set up a custom domain
2. Configure monitoring and alerts
3. Set up automated backups for your database
4. Consider implementing rate limiting
5. Add error tracking (e.g., Sentry)
6. Set up CI/CD for automated deployments

---

Your Chat Parser App should now be live and accessible to users worldwide! 🚀
