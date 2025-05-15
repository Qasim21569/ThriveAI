'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { useToast } from '@/components/ui/use-toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import EmotionIcon from '@mui/icons-material/EmojiEmotions';
import MoodIcon from '@mui/icons-material/Psychology';
import PeopleIcon from '@mui/icons-material/People';
import SaveIcon from '@mui/icons-material/Save';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { auth } from '@/lib/firebase/firebaseConfig';
import { savePlanToUserProfile } from '@/lib/firebase/userService';

interface MentalAssessment {
  greeting?: string;
  overview: {
    summary: string;
    strengths: string[];
    challenges: string[];
  };
  areas: {
    lifestyle: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    emotional: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    mental: {
      score: string;
      summary: string;
      recommendations: string[];
    };
    social: {
      score: string;
      summary: string;
      recommendations: string[];
    };
  };
  recommendations: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  resources: {
    practices: string[];
    support: string[];
  };
  action_plan?: {
    today: string[];
    this_week: string[];
    this_month: string[];
    ongoing: string[];
  };
  personal_insights?: string[];
}

export default function MentalWellbeingReportPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<MentalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const { toast } = useToast();

  // Load assessment from localStorage on component mount
  useEffect(() => {
    setLoading(true);
    try {
      const savedAssessment = localStorage.getItem('mentalAssessment');
      if (savedAssessment) {
        const parsedAssessment = JSON.parse(savedAssessment);
        setAssessment(parsedAssessment);
        
        // Generate a unique ID for this assessment if not already present
        const uniqueId = `mental-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setAssessmentId(uniqueId);
        
        // Check if the user is authenticated but don't auto-save to Firebase
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // Check if already saved by looking for assessment ID in local storage
            const savedIds = localStorage.getItem('savedAssessmentIds');
            if (savedIds) {
              const ids = JSON.parse(savedIds);
              setSavedToFirebase(ids.includes(uniqueId));
            }
          }
        });
        
        return () => unsubscribe();
      } else {
        setError('No assessment found. Please complete the mental wellbeing assessment first.');
      }
    } catch (e) {
      console.error('Error loading mental wellbeing assessment:', e);
      setError('Error loading your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save assessment to Firebase
  const saveToFirebase = async (assessmentData: MentalAssessment, userId: string) => {
    if (!assessmentData) return false;
    
    try {
      // Format assessment date for display
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Generate summary scores for display in profile
      const calculateOverallScore = () => {
        const scores = [
          assessmentData.areas.lifestyle.score,
          assessmentData.areas.emotional.score,
          assessmentData.areas.mental.score,
          assessmentData.areas.social.score
        ];
        
        // Count occurrences of different score types
        let needsAttention = 0;
        let moderate = 0;
        let good = 0;
        
        scores.forEach(score => {
          const lowerScore = score.toLowerCase();
          if (lowerScore.includes('need') || lowerScore.includes('poor') || lowerScore.includes('challenging')) {
            needsAttention++;
          } else if (lowerScore.includes('moderate') || lowerScore.includes('developing') || lowerScore.includes('functional')) {
            moderate++;
          } else {
            good++;
          }
        });
        
        // Determine overall score
        if (needsAttention >= 2) return 'Needs attention';
        if (needsAttention === 1 && moderate >= 2) return 'Needs attention';
        if (good >= 3) return 'Good';
        return 'Moderate';
      };
      
      const overallScore = calculateOverallScore();
      
      // Create summary for quick view in profile
      const strengthsSummary = assessmentData.overview.strengths.slice(0, 2).join('; ');
      const challengesSummary = assessmentData.overview.challenges.slice(0, 2).join('; ');
      const summaryText = `${strengthsSummary}. Challenges: ${challengesSummary}`;
      
      // Create a plan object with metadata and full assessment data
      const mentalWellbeingPlan = {
        id: assessmentId,
        type: 'mental_wellbeing',
        title: 'Mental Wellbeing Assessment',
        description: `Created on ${formattedDate} | Overall: ${overallScore}`,
        summary: summaryText,
        path: '/mental/report',
        score: overallScore,
        createdAt: new Date().toISOString(),
        fullAssessment: assessmentData // Store the complete assessment
      };
      
      // Save to Firebase
      const success = await savePlanToUserProfile(userId, mentalWellbeingPlan);
      
      if (success) {
        // Save assessment ID to localStorage to track which assessments have been saved
        const savedIds = localStorage.getItem('savedAssessmentIds');
        let ids = savedIds ? JSON.parse(savedIds) : [];
        ids.push(assessmentId);
        localStorage.setItem('savedAssessmentIds', JSON.stringify(ids));
      }
      
      return success;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      return false;
    }
  };

  // Manual save to Firebase button handler
  const handleSaveToProfile = async () => {
    if (!assessment) return;
    
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save this assessment to your profile",
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingToFirebase(true);
    
    try {
      const success = await saveToFirebase(assessment, user.uid);
      
      if (success) {
        setSavedToFirebase(true);
        toast({
          title: "Assessment Saved!",
          description: "Your assessment has been saved to your profile and can be accessed anytime",
        });
      } else {
        throw new Error("Failed to save assessment");
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        title: "Failed to save",
        description: "There was a problem saving your assessment. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  // Handle download as PDF function
  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      toast({
        title: "PDF Download",
        description: "This feature is not yet implemented",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get score color
  const getScoreColor = (score: string) => {
    const scoreMap: Record<string, string> = {
      'excellent': 'text-green-500',
      'good': 'text-green-400',
      'moderate': 'text-amber-400',
      'developing': 'text-amber-400',
      'functional': 'text-amber-400',
      'needs attention': 'text-orange-500',
      'needs development': 'text-orange-500',
      'needs support': 'text-orange-500',
      'challenging': 'text-red-400',
      'poor': 'text-red-500'
    };
    
    const lowerScore = score.toLowerCase();
    
    for (const [key, color] of Object.entries(scoreMap)) {
      if (lowerScore.includes(key)) {
        return color;
      }
    }
    
    return 'text-blue-400'; // Default color
  };

  // When there's an error or loading
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4">
        <Navbar />
        <div className="max-w-4xl mx-auto text-center mt-20">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-300 mb-6">
            {error}
          </h1>
          <Button 
            onClick={() => router.push('/mental/form')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Go to Assessment Form
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto" ref={contentRef}>
          {/* Back button */}
          <div className="mb-8">
            <Button
              variant="outline"
              size="sm"
              className="text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300"
              onClick={() => router.push('/mental')}
            >
              <ArrowBackIcon className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              Your Mental Wellbeing Assessment
            </h1>
            <p className="text-slate-300/80 mt-3 max-w-2xl mx-auto">
              Based on your responses, we've created this personalized assessment with insights and recommendations.
            </p>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="areas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Key Areas
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Resources
              </TabsTrigger>
              <TabsTrigger value="action" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Action Plan
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Assessment Overview</CardTitle>
                  <CardDescription>
                    A summary of your mental wellbeing based on your assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-300">{assessment.overview.summary}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <h3 className="text-lg font-medium text-blue-400 mb-3 flex items-center">
                        <CheckCircleIcon className="mr-2 text-blue-500" fontSize="small" />
                        Your Strengths
                      </h3>
                      <ul className="space-y-2">
                        {assessment.overview.strengths.map((strength, index) => (
                          <li key={index} className="bg-blue-950/30 p-3 rounded-md border border-blue-900/30 text-slate-300">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Challenges */}
                    <div>
                      <h3 className="text-lg font-medium text-amber-400 mb-3 flex items-center">
                        <WarningIcon className="mr-2 text-amber-500" fontSize="small" />
                        Your Challenges
                      </h3>
                      <ul className="space-y-2">
                        {assessment.overview.challenges.map((challenge, index) => (
                          <li key={index} className="bg-amber-950/20 p-3 rounded-md border border-amber-900/30 text-slate-300">
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Areas Tab */}
            <TabsContent value="areas">
              <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Key Areas Assessment</CardTitle>
                  <CardDescription>
                    Detailed analysis of different aspects of your mental wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lifestyle & Physical Health */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-blue-400 flex items-center">
                        <LocalCafeIcon className="mr-2 text-blue-500" fontSize="small" />
                        Lifestyle & Physical Health
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(assessment.areas.lifestyle.score)}`}>
                        {assessment.areas.lifestyle.score}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4">{assessment.areas.lifestyle.summary}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {assessment.areas.lifestyle.recommendations.map((rec, index) => (
                          <li key={index} className="text-slate-300 flex items-start">
                            <CheckCircleIcon className="text-blue-500 mr-2 flex-shrink-0" fontSize="small" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Emotional Regulation */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-blue-400 flex items-center">
                        <EmotionIcon className="mr-2 text-blue-500" fontSize="small" />
                        Emotional Regulation
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(assessment.areas.emotional.score)}`}>
                        {assessment.areas.emotional.score}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4">{assessment.areas.emotional.summary}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {assessment.areas.emotional.recommendations.map((rec, index) => (
                          <li key={index} className="text-slate-300 flex items-start">
                            <CheckCircleIcon className="text-blue-500 mr-2 flex-shrink-0" fontSize="small" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Mental Health */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-blue-400 flex items-center">
                        <MoodIcon className="mr-2 text-blue-500" fontSize="small" />
                        Mental Health
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(assessment.areas.mental.score)}`}>
                        {assessment.areas.mental.score}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4">{assessment.areas.mental.summary}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {assessment.areas.mental.recommendations.map((rec, index) => (
                          <li key={index} className="text-slate-300 flex items-start">
                            <CheckCircleIcon className="text-blue-500 mr-2 flex-shrink-0" fontSize="small" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Social Functioning */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-blue-400 flex items-center">
                        <PeopleIcon className="mr-2 text-blue-500" fontSize="small" />
                        Social Functioning
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(assessment.areas.social.score)}`}>
                        {assessment.areas.social.score}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-4">{assessment.areas.social.summary}</p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {assessment.areas.social.recommendations.map((rec, index) => (
                          <li key={index} className="text-slate-300 flex items-start">
                            <CheckCircleIcon className="text-blue-500 mr-2 flex-shrink-0" fontSize="small" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Personalized Recommendations</CardTitle>
                  <CardDescription>
                    Targeted suggestions to enhance your mental wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Immediate */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-3">Start Today</h3>
                    <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/30">
                      <ul className="space-y-3">
                        {assessment.recommendations.immediate.map((rec, index) => (
                          <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                            <CheckCircleIcon className="text-blue-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                            <span className="text-slate-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Short-term */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-3">This Week</h3>
                    <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-900/30">
                      <ul className="space-y-3">
                        {assessment.recommendations.short_term.map((rec, index) => (
                          <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                            <CheckCircleIcon className="text-indigo-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                            <span className="text-slate-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Long-term */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-3">Ongoing Practice</h3>
                    <div className="bg-violet-950/20 p-4 rounded-lg border border-violet-900/30">
                      <ul className="space-y-3">
                        {assessment.recommendations.long_term.map((rec, index) => (
                          <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                            <CheckCircleIcon className="text-violet-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                            <span className="text-slate-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Supportive Resources</CardTitle>
                  <CardDescription>
                    Tools, practices, and support systems to enhance your mental wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Practices */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-3">Recommended Practices</h3>
                    <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/30">
                      <ul className="space-y-3">
                        {assessment.resources.practices.map((practice, index) => (
                          <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                            <CheckCircleIcon className="text-blue-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                            <span className="text-slate-300">{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Support */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-3">Support Options</h3>
                    <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-900/30">
                      <ul className="space-y-3">
                        {assessment.resources.support.map((support, index) => (
                          <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                            <CheckCircleIcon className="text-indigo-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                            <span className="text-slate-300">{support}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mt-6">
                    <p className="text-slate-400 text-sm">
                      <strong>Note:</strong> This assessment is intended for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. If you're experiencing significant mental health challenges, please consult with a qualified healthcare provider.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Action Plan Tab */}
            <TabsContent value="action">
              <Card className="border border-blue-500/20 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-300">Your Action Plan</CardTitle>
                  <CardDescription>
                    A structured approach to improving your mental wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-300">
                      Based on your assessment, we've created this action plan to help you improve your mental wellbeing. Focus on implementing one or two recommendations at a time rather than trying to change everything at once.
                    </p>
                  </div>

                  {/* Today */}
                  <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/30">
                    <h3 className="text-lg font-medium text-blue-400 mb-3">Today</h3>
                    <ul className="space-y-2">
                      {assessment.recommendations.immediate.slice(0, 1).map((rec, index) => (
                        <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                          <CheckCircleIcon className="text-blue-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                          <span className="text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* This Week */}
                  <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-900/30">
                    <h3 className="text-lg font-medium text-indigo-400 mb-3">This Week</h3>
                    <ul className="space-y-2">
                      {assessment.recommendations.short_term.slice(0, 2).map((rec, index) => (
                        <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                          <CheckCircleIcon className="text-indigo-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                          <span className="text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* This Month */}
                  <div className="bg-violet-950/20 p-4 rounded-lg border border-violet-900/30">
                    <h3 className="text-lg font-medium text-violet-400 mb-3">This Month</h3>
                    <ul className="space-y-2">
                      <li className="bg-slate-900/50 p-3 rounded-md flex items-start">
                        <CheckCircleIcon className="text-violet-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                        <span className="text-slate-300">
                          {assessment.areas.lifestyle.recommendations[0]}
                        </span>
                      </li>
                      <li className="bg-slate-900/50 p-3 rounded-md flex items-start">
                        <CheckCircleIcon className="text-violet-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                        <span className="text-slate-300">
                          {assessment.areas.emotional.recommendations[0]}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Ongoing */}
                  <div className="bg-purple-950/20 p-4 rounded-lg border border-purple-900/30">
                    <h3 className="text-lg font-medium text-purple-400 mb-3">Ongoing Practice</h3>
                    <ul className="space-y-2">
                      {assessment.recommendations.long_term.slice(0, 2).map((rec, index) => (
                        <li key={index} className="bg-slate-900/50 p-3 rounded-md flex items-start">
                          <CheckCircleIcon className="text-purple-500 mt-1 mr-2 flex-shrink-0" fontSize="small" />
                          <span className="text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 text-center">
            <Button 
              onClick={() => router.push('/mental/form')}
              variant="outline"
              className="border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 mr-4"
            >
              Back to Assessment
            </Button>
            
            <Button 
              onClick={downloadAsPDF}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 mr-4"
            >
              Download PDF
            </Button>
            
            <Button 
              onClick={handleSaveToProfile}
              className={`${savedToFirebase 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700'}`}
              disabled={isSavingToFirebase || savedToFirebase}
            >
              {isSavingToFirebase ? (
                <span className="flex items-center gap-1">
                  <div className="h-4 w-4 border-2 border-t-transparent animate-spin rounded-full"></div>
                  <span className="ml-1">Saving...</span>
                </span>
              ) : savedToFirebase ? (
                <span className="flex items-center gap-1">
                  <CloudDoneIcon fontSize="small" /> 
                  <span className="ml-1">Saved to Profile</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <SaveIcon fontSize="small" /> 
                  <span className="ml-1">Save to Profile</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 