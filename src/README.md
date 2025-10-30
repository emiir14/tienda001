
# Joya - Elegancia Atemporal 💍

![Joya Store Banner](https://placehold.co/1200x400.png?text=Joya+Store)

Joya is a modern, stylish, and full-featured e-commerce storefront built with Next.js and designed for performance and easy deployment. It features a beautiful, clean interface, a fully functional shopping cart, and a secure checkout process with Mercado Pago.

---

### ✨ Features

-   **Modern Tech Stack:** Built with Next.js, React, and TypeScript for a fast and reliable user experience.
-   **Elegant Design:** A clean and professional design using Tailwind CSS and ShadCN UI components.
-   **Dual Data Mode:** Works with hardcoded sample data out-of-the-box for easy local development. Automatically switches to a live **PostgreSQL** database (using the `@neondatabase/serverless` driver) when production environment variables are provided.
-   **Fully Responsive:** Looks great on all devices, from desktops to mobile phones.
-   **Product Management:** An admin dashboard to easily create, edit, and delete products.
-   **Shopping Cart:** A persistent client-side shopping cart that remembers items between visits.
-   **Secure Payments:** Ready for production with a secure server-side integration for Mercado Pago using the Checkout API (Payment Bricks).
-   **Newsletter Integration:** Connects to Mailchimp for easy subscriber management.
-   **Easy Deployment:** Comes with a detailed deployment guide for Vercel, the recommended platform.

### 🚀 Getting Started (Local Development)

To get a local copy up and running on your computer, follow these simple steps.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/joya-store.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd joya-store
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Set up Environment Variables:**
    *   Rename the `.env.example` file to `.env.local`.
    *   The application will run with **hardcoded sample data** by default if you don't provide a database URL.
    *   Fill in the required variables in `.env.local`.

    ```env
    # --- DATABASE (OPTIONAL FOR LOCAL DEV) ---
    # If this is not set, the app will use hardcoded sample data.
    # POSTGRES_URL="postgres://..."

    # --- ADMIN CREDENTIALS (REQUIRED FOR ADMIN PANEL) ---
    ADMIN_EMAIL="your-admin-email@example.com"
    ADMIN_PASSWORD="your-secure-password"
    
    # --- MERCADO PAGO (USE TEST CREDENTIALS FOR LOCAL) ---
    MERCADOPAGO_ACCESS_TOKEN="YOUR_TEST_ACCESS_TOKEN"
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="YOUR_TEST_PUBLIC_KEY"
    
    # --- CRITICAL FOR LOCAL REDIRECTS ---
    # Make sure this URL matches your local development server exactly.
    NEXT_PUBLIC_SITE_URL="http://localhost:9002"

    # --- MAILCHIMP (OPTIONAL) ---
    # To enable the newsletter subscription form.
    # MAILCHIMP_API_KEY="your_mailchimp_api_key"
    # MAILCHIMP_SERVER_PREFIX="your_mailchimp_server_prefix" # e.g., us21
    # MAILCHIMP_AUDIENCE_ID="your_mailchimp_audience_id"
    ```
5.  **Run the development server:**
    ```sh
    npm run dev
    ```
6.  Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

---

## 🚀 Recommended: Deploying to Vercel (Easiest Method)

This guide will walk you through deploying your application to Vercel, which is the platform built by the creators of Next.js. It's the most seamless way to go live.

### Part 1: Get Your Project on GitHub

First, you need to store your code in a GitHub repository. Vercel will connect directly to it.

1.  **Create a GitHub Repository:**
    *   Go to [GitHub.com](https://github.com) and log in.
    *   Click the **+** icon in the top-right and select **"New repository"**.
    *   Choose a name (e.g., `joya-store`) and select **"Private"**.
    *   **Do not** initialize it with a README or other files.
    *   Click **"Create repository"**. Copy the repository URL it shows you.

2.  **Upload Your Code:**
    *   Open a terminal in your project's folder and run these commands:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    # Replace the URL with your new repository's URL
    git remote add origin https://github.com/your-username/joya-store.git
    git push -u origin main
    ```
    *   Refresh your GitHub page. Your code is now online!

### Part 2: Deploy to Vercel & Create Your Database

Now, we'll connect Vercel to your GitHub repository, create a database, and tell your project the secret keys.

1.  **Import Your Project:**
    *   Go to [Vercel.com](https://vercel.com) and sign up with your GitHub account.
    *   On your Vercel dashboard, go to the **"Projects"** tab and click **"Add New... > Project"**.
    *   Find your `joya-store` repository and click **"Import"**.

2.  **Create and Connect a Database:**
    *   Before deploying, go to the **"Storage"** tab in your Vercel project configuration.
    *   Click **"Create Database"** and choose **"Postgres"**.
    *   Give it a name (e.g., `joya-db`), choose a region, and accept the terms.
    *   After the database is created, Vercel will automatically connect it to your project. This sets the `POSTGRES_URL` environment variable for you.

3.  **Configure Other Environment Variables:**
    *   This is the most important step. In the "Environment Variables" section, you will add your secret keys.
    *   **Admin Credentials (Required):**
        *   `ADMIN_EMAIL`: The email you want to use to log in to the admin panel.
        *   `ADMIN_PASSWORD`: The secure password for the admin panel.
    *   **Mercado Pago Variables:** Get these from your [Mercado Pago Developer Dashboard](https://www.mercadopago.com/developers). Use your **Production** credentials.
        *   `MERCADOPAGO_ACCESS_TOKEN`: Your Production "Access Token".
        *   `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: Your Production "Public Key".
    *   **Site URL Variable (CRITICAL):** Vercel will assign you a domain (e.g., `joya-store-abcdef.vercel.app`). You need to add it here so Mercado Pago knows where to send users back to.
        *   `NEXT_PUBLIC_SITE_URL`: The full `https://` URL of your site.
    *   **Mailchimp Variables (Optional):** To enable the newsletter form.
        *   `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_AUDIENCE_ID`
    *   Click **"Deploy"**. Vercel will build and launch your application.

### Part 3: Create the Database Tables (CRITICAL)

Your Vercel Postgres database is currently empty. We need to create the tables.

1.  On your Vercel dashboard, go to the **Storage** tab, select your database, and then click on the **"Query"** tab.
2.  Open the `database.sql` file in your project, **copy the entire content**, and paste it into the query editor on Vercel.
3.  Click **"Run"**. This will create the necessary table structure.

### Part 4: Configure Mercado Pago Webhook

After your site is live with HTTPS, you must tell Mercado Pago where to send payment updates.

1.  **Go to your Mercado Pago Developer Dashboard.**
2.  Navigate to **Your Applications > (Your App Name) > Webhooks**.
3.  In the "Production" URL field, enter the full URL to your new webhook endpoint. It will be your Vercel production domain followed by `/api/mercadopago-webhook`. For example:
    ```
    https://joya-store-abcdef.vercel.app/api/mercadopago-webhook
    ```
4.  Under "Events", make sure that **Payments** (`payment`) is selected.
5.  Save your changes. This step is essential for your server to receive payment confirmations.

### You're Live!

Congratulations! Your store is now fully deployed and running on a live database at the URL Vercel provided.

-   **Go to the `/admin` page** on your live site to add your real products.
-   **Future Updates:** Every time you `git push` new changes to your `main` branch, Vercel will automatically redeploy the site for you.

---

This project was built with assistance from **Firebase Studio**.
