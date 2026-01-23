const Employee = require('../models/Employee');

const dummyEmployees = [
  {
    name: 'Dr Sunil Kumar',
    title: 'Psychologist & CBT Therapist',
    experience: '10+ years',
    price: {
      amount: 2500,
      duration: 50,
      currency: '₹'
    },
    expertise: ['Stress', 'Anxiety', 'Depression', 'Emotional regulation', 'Behavioral challenges'],
    languages: ['English', 'Hindi'],
    gender: 'Male',
    center: 'Delhi',
    description: 'Qualified Psychologist and CBT Therapist with 10+ years of experience, passionate about helping individuals improve their mental and emotional well-being.',
    bio: 'I am Dr. Sunil, a qualified Psychologist and CBT Therapist, passionate about helping individuals improve their mental and emotional well-being. I chose the field of therapy to support people in understanding their thoughts, emotions, and behaviors, and to guide them toward healthier coping strategies. I believe in creating a safe, empathetic, and non-judgmental space for every client. With experience in psychological assessment, counseling, and evidence-based CBT interventions, I work with concerns such as stress, anxiety, depression, emotional regulation, and behavioral challenges. My approach is client-centered, ethical, and goal-oriented, focusing on practical solutions and long-term positive change.',
    qualifications: 'M.A Psychology & CBT Practitioner',
    faqAnswer: 'I chose the field of therapy to support people in understanding their thoughts, emotions, and behaviors, and to guide them toward healthier coping strategies. I believe in creating a safe, empathetic, and non-judgmental space for every client.',
    testimonial: 'Dr. Sunil\'s extensive experience and practical CBT approach have been instrumental in my recovery from depression. His goal-oriented therapy and ethical practice have helped me develop long-term coping strategies. I feel much more equipped to handle life\'s challenges now.',
    email: 'kumarsunil1002452@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Prithvi Padam',
    title: 'Psychologist',
    experience: '4+ years of experience',
    price: {
      amount: 1800,
      duration: 45,
      currency: '₹'
    },
    expertise: ['Anxiety disorders', 'Depression', 'Emotional distress', 'CBT', 'DBT', 'REBT', 'Person Centered Therapy', 'Interpersonal relationships'],
    languages: ['English', 'Hindi', 'Punjabi'],
    gender: 'Male',
    center: 'Delhi',
    description: 'I am a psychologist with a Master\'s degree in Psychology and over four years of experience working in clinical settings. I am trained in evidence-based therapeutic approaches including Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), Rational Emotive Behavior Therapy (REBT), Client/Person Centered Therapy.',
    bio: 'I am a psychologist with a Master\'s degree in Psychology and over four years of experience working in clinical settings. I am trained in evidence-based therapeutic approaches including Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), Rational Emotive Behavior Therapy (REBT), Client/Person Centered Therapy. My work focuses on providing structured, compassionate, and goal-oriented therapy to help individuals manage emotional distress, develop healthier coping strategies, and improve overall psychological well-being.',
    qualifications: 'Master\'s degree in Psychology',
    faqAnswer: 'I wanted to become a therapist because I value meaningful human connection and believe that with the right tools and support, people can make lasting psychological changes. Being able to support others through difficult phases of life is both challenging and deeply fulfilling for me.',
    testimonial: 'Sessions with Prithvi are going great. They have been really helpful, I have noticed significant progress after meeting them. The structured approach and evidence-based techniques have made a real difference in my mental well-being.',
    email: 'prithvipadam@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Priyanka Leekha',
    title: 'Counselling Psychologist',
    experience: '2+ years of experience',
    price: {
      amount: 1500,
      duration: 45,
      currency: '₹'
    },
    expertise: ['Depression', 'Anxiety disorders', 'OCD', 'Adjustment issues', 'Emotional dysregulation', 'Self-esteem challenges', 'Child & Adolescent Psychology'],
    languages: ['English', 'Hindi', 'Punjabi'],
    gender: 'Female',
    center: 'Delhi',
    description: 'Counselling Psychologist specializing in pediatric and adolescent mental health, managing both clinical diagnoses and general behavioral concerns.',
    bio: 'I am a Counselling Psychologist with a Master of Arts (M.A.) in Psychology. I specialize in diagnosis and management of Depression, Anxiety, and OCD in young populations. My focus is on addressing adjustment issues, emotional dysregulation, and self-esteem challenges. I bridge clinical intervention with age-appropriate therapeutic support for children and adolescents.',
    qualifications: 'Master of Arts (M.A.) in Psychology',
    faqAnswer: 'I am driven by the power of early intervention. My goal is to equip young people with psychological resilience today, so they don\'t have to spend their adulthood "fixing" their childhood. I combine evidence-based clinical rigor with a relatable, creative approach that lowers the defenses of young clients, making complex therapy feel accessible and safe.',
    testimonial: 'Priyanka has been wonderful with my child. Her approach is gentle yet effective, and my child feels comfortable opening up to her. We have seen great improvement in managing anxiety and emotional regulation.',
    email: 'leekha.priyanka@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Dr. Vanita Kumari',
    title: 'Psychologist',
    experience: '2.5+ years of experience',
    price: {
      amount: 1600,
      duration: 45,
      currency: '₹'
    },
    expertise: ['Anxiety Disorders', 'Depression & Mood Issues', 'Anger Management', 'Relationship & Marital Issues', 'Low Self-Esteem', 'Behavioral Issues', 'Child & Adolescent Psychology'],
    languages: ['Hindi', 'Punjabi', 'English'],
    gender: 'Female',
    center: 'Chandigarh',
    description: 'Certified CBT Practitioner with expertise in Anxiety Disorders, Depression, Anger Management, and Relationship Issues.',
    bio: 'I hold a BHMS degree and M.Sc. in Psychology, and I am a Certified CBT Practitioner. With 2.5 years of clinical experience, I work with Anxiety Disorders, Depression & Mood Issues, Anger Management, Relationship & Marital Issues, Low Self-Esteem, and Behavioral Issues in children, adolescents, and young adults. My therapeutic approaches include Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), Acceptance & Commitment Therapy (ACT), and Solution-Focused Brief Therapy (SFBT).',
    qualifications: 'BHMS, M.Sc. Psychology, Certified CBT Practitioner',
    faqAnswer: 'I want to become a therapist because I genuinely want to help people understand themselves better. Many individuals struggle silently with emotions, stress, or emotional pain and often they simply need someone who listens without judgement. I believe that therapy can provide people with clarity, emotional strength and healthier ways to cope with life\'s challenges. Being a therapist allows me to support others in their healing journey and help them feel understood, valued and empowered.',
    testimonial: 'Dr. Vanita has been extremely supportive throughout my therapy journey. Her CBT approach has helped me manage my anxiety and depression effectively. I feel more in control of my emotions now.',
    email: 'vanita734722@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Ramandeep Kaur',
    title: 'Psychologist',
    experience: '3+ years of experience',
    price: {
      amount: 1700,
      duration: 45,
      currency: '₹'
    },
    expertise: ['Anxiety', 'Stress and emotional overwhelm', 'Low self esteem and confidence issues', 'Relationship and interpersonal concerns', 'Adjustment issues'],
    languages: ['English', 'Hindi', 'Punjabi'],
    gender: 'Female',
    center: 'Punjab',
    description: 'Psychologist with 3 years of experience working with adolescents, young adults and adults through counseling sessions, psychological assessment and case discussions.',
    bio: 'I am a Psychologist with M.Sc. in Psychology, Certified Counselor (CCI), and CBT Practitioner. I have 3 years of experience working with adolescents, young adults and adults. My clinical exposure includes counseling sessions, psychological assessment and case discussions. I work with individuals experiencing anxiety, stress and emotional overwhelm, low self esteem and confidence issues, relationship and interpersonal concerns, and adjustment issues.',
    qualifications: 'M.Sc. Psychology, Certified Counselor (CCI), CBT Practitioner',
    faqAnswer: 'I didn\'t choose this field because I had all the answers. I chose it because I kept meeting people who were silently struggling, and I realised that being present, listening without judging, and helping someone understand themselves can change a life.',
    testimonial: 'Ramandeep has a wonderful ability to make you feel heard and understood. Her non-judgmental approach and practical strategies have helped me work through my self-esteem and relationship issues. I highly recommend her.',
    email: 'lordslove89@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Dr. Mitali Sharma',
    title: 'Clinical Psychologist',
    experience: '3+ years of experience',
    price: {
      amount: 2200,
      duration: 50,
      currency: '₹'
    },
    expertise: ['Depression', 'Anxiety disorders', 'Post-Traumatic Stress Disorder (PTSD)', 'Self-esteem and identity-related concerns', 'LGBTQIA+ mental health issues', 'School refusal and academic stress', 'Adolescent behavioral and emotional difficulties'],
    languages: ['English', 'Hindi'],
    gender: 'Female',
    center: 'Delhi',
    description: 'RCI-licensed Clinical Psychologist with Ph.D. in Clinical Psychology, specializing in evidence-based interventions for children, adolescents, and adults.',
    bio: 'I hold a Ph.D. in Clinical Psychology and a Master\'s degree in Clinical Psychology. I am an RCI-licensed, certified counselor and have also completed a Diploma in Guidance and Counseling. With over 3 years of experience in therapeutic settings, I have worked closely with children, adolescents, and adults, offering evidence-based psychological interventions and emotional support across diverse mental health concerns, as well as career counseling for adolescents and young adults.',
    qualifications: 'Ph.D. in Clinical Psychology, Master\'s in Clinical Psychology, RCI-licensed, Diploma in Guidance and Counseling',
    faqAnswer: 'I chose psychology because I have always been deeply interested in understanding human emotions, behavior, and the silent struggles people carry within them. Over time, this interest grew into a purpose—to create a safe, non-judgmental space where individuals feel heard, understood, and supported. Becoming a psychologist allows me to walk alongside people during their most vulnerable moments and help them develop insight, resilience, and meaningful change. For me, psychology is not just a profession; it is a commitment to empathy, healing, and growth.',
    testimonial: 'Dr. Mitali is an exceptional psychologist. Her expertise in working with LGBTQIA+ individuals and trauma has been invaluable. She creates a truly safe space where I feel comfortable being myself. Her integrative approach has helped me make significant progress.',
    email: 'mitalisharma61196@gmail.com',
    availableSlots: generateSlots('Online', 7)
  },
  {
    name: 'Dr. Ritu',
    title: 'Psychologist',
    experience: '5+ years of experience',
    price: {
      amount: 2000,
      duration: 45,
      currency: '₹'
    },
    expertise: ['Anxiety', 'Depression', 'OCD', 'Person centered counseling', 'Family counseling', 'Couple counseling'],
    languages: ['English', 'Hindi', 'Punjabi'],
    gender: 'Female',
    center: 'Delhi',
    description: 'Psychologist with 5 years of experience specializing in anxiety, depression, OCD, person centered counseling, family counseling and couple counseling.',
    bio: 'I am a Psychologist with qualifications in BHMS, CBT Practitioner certification, and M.A. in Psychology. With 5 years of experience, I work with all sorts of psychological disorders like anxiety, depression, OCD, person centered counseling, family counseling and couple counseling. I have chosen to be a Psychologist based on my clinical experiences where I saw that emotions are baseline of human behavior and both progress and regression depends upon our sensitivity and emotional level.',
    qualifications: 'BHMS, CBT Practitioner, M.A. (Psychology)',
    faqAnswer: 'I have chosen to be a Psychologist on my clinical experiences. Emotions are baseline of human behavior. Both progress and regression depends upon our sensitivity and emotional level. In my clinical practise I have seen diseases not getting cured because of stress and doctors used to say there is some sort of stress lying because of which medicine are not responding. Then I have taken decision why not choose a profession which helps patient to strengthen their sensitivity and curing disease. While adopting this profession I found wonderful result not only at psychology point of view but as well in physical complaints also, patient developed themselves as a strong personality.',
    testimonial: 'Dr. Ritu\'s holistic approach to therapy has been life-changing. She helped me understand the connection between my emotional state and physical health. Her expertise in family and couple counseling has improved my relationships significantly.',
    email: 'rmudgil7198@gmail.com',
    availableSlots: generateSlots('Online', 7)
  }
];

function generateSlots(type, days) {
  const slots = [];
  // Morning slots
  const morningTimes = ['09:00 AM', '10:00 AM', '11:00 AM'];
  // Afternoon slots
  const afternoonTimes = ['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  // Evening slots
  const eveningTimes = ['06:00 PM', '07:00 PM'];
  
  const allTimes = [...morningTimes, ...afternoonTimes, ...eveningTimes];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    // Generate slots for both Online and In-person
    ['Online', 'In-person'].forEach(slotType => {
      allTimes.forEach(time => {
        // Make some slots unavailable randomly (20% chance)
        const isBooked = Math.random() < 0.2;
        
        slots.push({
          date: new Date(date),
          time: time,
          type: slotType,
          isBooked: isBooked
        });
      });
    });
  }
  
  return slots;
}

async function seedData() {
  try {
    const count = await Employee.countDocuments();
    
    if (count === 0) {
      console.log('🔄 Seeding employee data with real therapist information...');
      const inserted = await Employee.insertMany(dummyEmployees);
      console.log('✅ Employee data seeded successfully!');
      console.log(`✅ Inserted ${inserted.length} employees`);
      
      // Log first employee's slots for debugging
      if (inserted.length > 0) {
        const firstEmployee = await Employee.findById(inserted[0]._id);
        console.log('📅 First employee slots count:', firstEmployee.availableSlots?.length || 0);
        if (firstEmployee.availableSlots && firstEmployee.availableSlots.length > 0) {
          console.log('✅ Sample slot:', {
            date: firstEmployee.availableSlots[0].date,
            time: firstEmployee.availableSlots[0].time,
            type: firstEmployee.availableSlots[0].type,
            isBooked: firstEmployee.availableSlots[0].isBooked
          });
        }
      }
    } else {
      console.log(`⚠️  Employee data already exists (${count} employees).`);
      console.log('🔄 Replacing with new therapist data...');
      
      // Delete all existing employees
      await Employee.deleteMany({});
      console.log('✅ Old data deleted.');
      
      // Insert new data
      const inserted = await Employee.insertMany(dummyEmployees);
      console.log('✅ New employee data seeded successfully!');
      console.log(`✅ Inserted ${inserted.length} employees`);
      
      // Log first employee
      if (inserted.length > 0) {
        const firstEmployee = await Employee.findById(inserted[0]._id);
        console.log('👤 First employee:', firstEmployee.name);
        console.log('📅 Slots count:', firstEmployee.availableSlots?.length || 0);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

module.exports = seedData;
