import * as admin from 'firebase-admin'

// Initialize Firebase Admin with project ID
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'retail-shop-9bc30',
  })
}

const db = admin.firestore()

async function seedInitialData() {
  try {
    console.log('Starting database seeding...')

    // Create initial owner account
    const ownerEmail = 'owner@retailshop.com' // Change this to your email
    const ownerData = {
      email: ownerEmail,
      displayName: 'Shop Owner',
      role: 'owner',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Check if owner already exists
    const existingOwner = await db.collection('staff').where('email', '==', ownerEmail).get()
    if (existingOwner.empty) {
      await db.collection('staff').add(ownerData)
      console.log(`✅ Created owner account: ${ownerEmail}`)
    } else {
      console.log(`ℹ️  Owner account already exists: ${ownerEmail}`)
    }

    // Create sample categories for expenses
    const categories = ['General', 'Supplies', 'Rent', 'Utilities', 'Marketing', 'Other']
    console.log(`ℹ️  Available expense categories: ${categories.join(', ')}`)

    console.log('✅ Database seeding completed!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Create a Firebase Auth account with the email:', ownerEmail)
    console.log('2. Sign in to the app with that account')
    console.log('3. You will have full owner permissions')
    console.log('4. Use the Staff Management page to add more team members')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

// Run the seed function
seedInitialData().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('❌ Seed script failed:', error)
  process.exit(1)
})