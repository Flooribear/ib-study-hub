import { useState, useEffect } from 'react'
import './App.css'
import { db, auth, googleProvider } from './firebase'


import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  deleteField
} from 'firebase/firestore'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'

function App() {
  const [activeTab, setActiveTab] = useState('login')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [feedback, setFeedback] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('ib-study-hub-theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    
    // Check system preference as fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }
    
    // Default to light mode
    return false
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherSubjects, setTeacherSubjects] = useState([])
  const [currentSubjectPage, setCurrentSubjectPage] = useState(null)
  const [subjectNotes, setSubjectNotes] = useState({})
  const [teachers, setTeachers] = useState([])
  
  // Authentication states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  
  // Admin states
  const [allUsers, setAllUsers] = useState([])
  const [adminStats, setAdminStats] = useState({})

  // New teacher states
  const [newTeacherEmail, setNewTeacherEmail] = useState('')
  const [newTeacherSubjects, setNewTeacherSubjects] = useState([])
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  
  // Add subjects to existing teacher states
  const [showAddSubjects, setShowAddSubjects] = useState(false)
  const [selectedTeacherForSubjects, setSelectedTeacherForSubjects] = useState(null)
  const [additionalSubjects, setAdditionalSubjects] = useState([])

  // Teacher panel states
  const [showAddTopic, setShowAddTopic] = useState(false)

  const [newTopic, setNewTopic] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteIsPublic, setNewNoteIsPublic] = useState(false) // Default to private for security
  const [editingNote, setEditingNote] = useState(null)
  const [showEditNote, setShowEditNote] = useState(false)
  const [fullPageNote, setFullPageNote] = useState(null) // For full page note view
  
  // Rich text editing states
  const [showRichTextToolbar, setShowRichTextToolbar] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  
  // Questions states
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizSubject, setQuizSubject] = useState('')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentMarks, setCurrentMarks] = useState(1)
  const [quizCode, setQuizCode] = useState('')
  const [showQuizCode, setShowQuizCode] = useState(false)
  const [studentQuizCode, setStudentQuizCode] = useState('')
  const [studentAnswers, setStudentAnswers] = useState({})
  const [showStudentQuiz, setShowStudentQuiz] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizResults, setQuizResults] = useState(null)
  const [allQuizzes, setAllQuizzes] = useState([])
  
  // AI Configuration states
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [openAIKey, setOpenAIKey] = useState('')
  const [useAIMarking, setUseAIMarking] = useState(false)
  const [aiMarkingPrompt, setAiMarkingPrompt] = useState('')
  
  // Student submissions management states
  const [showStudentSubmissions, setShowStudentSubmissions] = useState(false)
  const [studentSubmissions, setStudentSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [manualMarking, setManualMarking] = useState({})
  const [showManualMarking, setShowManualMarking] = useState(false)
  
  // Individual student view states
  const [showIndividualStudent, setShowIndividualStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Quiz submission loading state
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
  
  // Student subject selection states
  const [studentSelectedSubjects, setStudentSelectedSubjects] = useState([])
  const [showSubjectSelection, setShowSubjectSelection] = useState(false)
  
  // Loading states for buttons
  const [isLoadingViewSubmissions, setIsLoadingViewSubmissions] = useState(false)
  const [isLoadingViewAnswers, setIsLoadingViewAnswers] = useState(false)
  const [isLoadingAIMarking, setIsLoadingAIMarking] = useState({})
  const [isLoadingManualMarking, setIsLoadingManualMarking] = useState({})
  const [isLoadingMarkAllAI, setIsLoadingMarkAllAI] = useState(false)
  
  // Button loading states for preventing multiple inputs
  const [buttonLoadingStates, setButtonLoadingStates] = useState({})
  const [buttonSuccessStates, setButtonSuccessStates] = useState({})
  
  // Custom notification system to replace alerts
  const [notifications, setNotifications] = useState([])
  const [loadingStates, setLoadingStates] = useState({})
  
  // Success states for buttons (to show tick animation)
  const [successStates, setSuccessStates] = useState({})
  
  // Loading states for content
  const [contentLoading, setContentLoading] = useState({
    teacherPanel: false,
    subjectNotes: false,
    allSubjects: false
  })
  
  // Global view mode switching - Set default based on user type
  const [globalViewMode, setGlobalViewMode] = useState(() => {
    // Default will be set after user authentication
    return 'student' // Temporary default, will be updated
  })

  // Firebase authentication and data management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Check if user is admin
        if (user.email === 'atharvamehrotra123@gmail.com') {
          setIsAdmin(true)
          await loadAdminData()
          // Clean up any existing placeholder notes
          await cleanupPlaceholderNotes()
        }
        
        // Load user's selected subjects from Firestore
        await loadUserSubjects(user.uid)
        // Load teacher data if applicable
        await loadTeacherData(user.uid)
        
        // Set appropriate default view mode based on user type
        if (user.email === 'atharvamehrotra123@gmail.com') {
          setGlobalViewMode('normal') // Admin starts in normal mode
        } else if (isTeacher) {
          setGlobalViewMode('teacher') // Teachers start in teacher mode
        } else {
          setGlobalViewMode('student') // Students start in student mode
        }
        
        setActiveTab('subjects')
      } else {
        setUser(null)
        setIsAdmin(false)
        setIsTeacher(false)
        setActiveTab('login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Apply saved theme preference on mount
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    }
  }, [])

  // Update selectedSubject when selectedSubjects changes
  useEffect(() => {
    if (selectedSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(selectedSubjects[0].id)
    }
  }, [selectedSubjects, selectedSubject])

  // Load notes for selected subject when it changes
  useEffect(() => {
    if (selectedSubject && !subjectNotes[selectedSubject]) {
      console.log('Loading notes for selected subject:', selectedSubject)
      loadNotesForSubject(selectedSubject)
    }
  }, [selectedSubject])

  // Load notes for all subjects when teacher panel is opened
  useEffect(() => {
    if (activeTab === 'teacher' && isTeacher) {
      setContentLoading(prev => ({ ...prev, teacherPanel: true }))
      loadAllSubjectNotes().finally(() => {
        setContentLoading(prev => ({ ...prev, teacherPanel: false }))
      })
    }
  }, [activeTab, isTeacher])

  // Load quizzes when AI tab is opened
  useEffect(() => {
    if (activeTab === 'ai') {
      loadAllQuizzes()
    }
  }, [activeTab])

  // Load AI configuration when user is authenticated
  useEffect(() => {
    if (user && isTeacher) {
      loadAIConfiguration()
    }
  }, [user, isTeacher])

  // Load student submissions when user is authenticated and not a teacher
  useEffect(() => {
    if (user && !isTeacher) {
      loadStudentSubmissions(false) // Don't show view automatically for students
      loadStudentSubjectSelection() // Load their subject selection
    }
  }, [user, isTeacher])



  // Function to load notes for a subject (for students) - OPTIMIZED VERSION
  const loadNotesForSubject = async (subjectId) => {
    try {
      setContentLoading(prev => ({ ...prev, subjectNotes: true }))
      console.log('loadNotesForSubject called for:', subjectId)
      
      // Always load fresh notes for students to ensure privacy filtering
      // This prevents cached private notes from being shown to students
      const notes = await loadSubjectNotes(subjectId, false) // false = student view
      console.log('Notes loaded for subject:', subjectId, 'Count:', notes.length)
      setSubjectNotes(prev => ({ ...prev, [subjectId]: notes }))
    } catch (error) {
      console.error('Error loading notes for subject:', subjectId, error)
    } finally {
      setContentLoading(prev => ({ ...prev, subjectNotes: false }))
    }
  }

  // Function to load notes for all subjects (for teachers) - OPTIMIZED VERSION
  const loadAllSubjectNotes = async () => {
    try {
      setContentLoading(prev => ({ ...prev, allSubjects: true }))
      console.log('Loading notes for all subjects (optimized)...')
      
      // Get all subjects that need loading
      const allSubjects = subjectBlocks.flatMap(block => block.subjects)
      const subjectsToLoad = allSubjects.filter(subject => !subjectNotes[subject.id])
      
      if (subjectsToLoad.length === 0) {
        console.log('All subjects already loaded')
        return
      }
      
      console.log(`Loading ${subjectsToLoad.length} subjects in parallel...`)
      
      // Load all subjects in parallel instead of sequentially
      const loadingPromises = subjectsToLoad.map(async (subject) => {
        try {
          const notes = await loadSubjectNotes(subject.id, true)
          return { subjectId: subject.id, notes }
        } catch (error) {
          console.error(`Error loading notes for ${subject.name}:`, error)
          return { subjectId: subject.id, notes: [] }
        }
      })
      
      // Wait for all subjects to load simultaneously
      const results = await Promise.all(loadingPromises)
      
      // Update state with all loaded notes at once
      const newSubjectNotes = {}
      results.forEach(({ subjectId, notes }) => {
        newSubjectNotes[subjectId] = notes
      })
      
      setSubjectNotes(prev => ({ ...prev, ...newSubjectNotes }))
      
      console.log(`Successfully loaded ${results.length} subjects in parallel`)
    } catch (error) {
      console.error('Error loading all subject notes:', error)
    } finally {
      setContentLoading(prev => ({ ...prev, allSubjects: false }))
    }
  }

  // Load admin data
  const loadAdminData = async () => {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = []
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() })
      })
      setAllUsers(users)

      // Get teachers
      const teachersSnapshot = await getDocs(collection(db, 'teachers'))
      const teachers = []
      teachersSnapshot.forEach(doc => {
        teachers.push({ id: doc.id, ...doc.data() })
      })
      setTeachers(teachers)

      // Get feedback stats
      const feedbackSnapshot = await getDocs(collection(db, 'feedback'))
      const feedbackCount = feedbackSnapshot.size
      
      setAdminStats({
        totalUsers: users.length,
        totalFeedback: feedbackCount,
        activeUsers: users.filter(u => u.lastUpdated).length,
        totalTeachers: teachers.length
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  // Load teacher data for current user
  const loadTeacherData = async (userId) => {
    try {
      const teacherDoc = await getDoc(doc(db, 'teachers', userId))
      if (teacherDoc.exists()) {
        setIsTeacher(true)
        setTeacherSubjects(teacherDoc.data().subjects || [])
      }
    } catch (error) {
      console.error('Error loading teacher data:', error)
    }
  }

  // Clean up existing placeholder notes to remove the isTopicPlaceholder flag
  const cleanupPlaceholderNotes = async () => {
    try {
      const notesQuery = query(collection(db, 'subjectNotes'), where('isTopicPlaceholder', '==', true))
      const notesSnapshot = await getDocs(notesQuery)
      
      const updatePromises = notesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isTopicPlaceholder: deleteField()
        })
      )
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
        console.log(`Cleaned up ${updatePromises.length} placeholder notes`)
      }
    } catch (error) {
      console.error('Error cleaning up placeholder notes:', error)
    }
  }

  // Load subject notes from Firestore
  const loadSubjectNotes = async (subjectId, isTeacherView = false) => {
    try {
      console.log('Loading notes for subject:', subjectId, 'Teacher view:', isTeacherView)
      
      // Test database connection
      console.log('Testing database connection...')
      const testSnapshot = await getDocs(collection(db, 'subjectNotes'))
      console.log('Database connection successful. Total notes in collection:', testSnapshot.size)
      
      // Load notes from Firestore
      const notesSnapshot = await getDocs(collection(db, 'subjectNotes'))
      const notes = []
      notesSnapshot.forEach(doc => {
        const note = doc.data()
        if (note.subjectId === subjectId) {
          // Ensure isPublic defaults to false if not set (secure by default)
          const noteWithDefaults = {
            id: doc.id,
            ...note,
            isPublic: note.isPublic === true ? true : false // Only true if explicitly set to true
          }
          
          // If not teacher view, only show public notes
          if (isTeacherView) {
            // Teacher view: show all notes (public and private)
            notes.push(noteWithDefaults)
          } else {
                      // Student view: only show public notes
          if (noteWithDefaults.isPublic === true) {
            notes.push(noteWithDefaults)
            console.log('Student view: showing public note:', noteWithDefaults.title)
          } else {
            console.log('Student view: hiding private note:', noteWithDefaults.title, 'isPublic:', noteWithDefaults.isPublic)
          }
          }
        }
      })
      
      console.log('Loaded notes from Firestore:', notes)
      
      // Load topics from Firestore
      const topicsSnapshot = await getDocs(collection(db, 'topics'))
      const topics = []
      topicsSnapshot.forEach(doc => {
        const topic = doc.data()
        if (topic.subjectId === subjectId) {
          topics.push({ id: doc.id, ...topic })
        }
      })
      
      console.log('Loaded topics from Firestore:', topics)
      

      
      // Simply return the notes we found in the database
      // No more automatic placeholder creation
      console.log('Returning notes from database:', notes)
      return notes
      
      console.log('Final combined notes:', allNotes)
      return allNotes
    } catch (error) {
      console.error('Error loading subject notes:', error)
      return []
    }
  }

  // Add teacher permission
  const addTeacherPermission = async (userId, subjects) => {
    try {
      await setDoc(doc(db, 'teachers', userId), {
        userId,
        subjects,
        addedAt: new Date(),
        addedBy: user.uid
      })
      await loadAdminData()
    } catch (error) {
      console.error('Error adding teacher permission:', error)
    }
  }



  // Add teacher by email
  const handleAddTeacher = async () => {
    if (!newTeacherEmail || newTeacherSubjects.length === 0) {
      alert('Please enter an email and select at least one subject')
      return
    }

    // Prevent multiple clicks
    if (loadingStates['add-teacher']) return
    
    setLoadingStates(prev => ({ ...prev, 'add-teacher': true }))

    try {
      // Find user by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', newTeacherEmail))
      const userSnapshot = await getDocs(usersQuery)
      
      if (userSnapshot.empty) {
        alert('User not found. They must sign up first.')
        return
      }

      const userDoc = userSnapshot.docs[0]
      await addTeacherPermission(userDoc.id, newTeacherSubjects)
      
      // Reset form
      setNewTeacherEmail('')
      setNewTeacherSubjects([])
      setShowAddTeacher(false)
      
      // Show success state
      setSuccessStates(prev => ({ ...prev, 'add-teacher': true }))
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, 'add-teacher': false }))
      }, 2000)
      
      alert('Teacher added successfully!')
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert('Error adding teacher. Please try again.')
    } finally {
      setLoadingStates(prev => ({ ...prev, 'add-teacher': false }))
    }
  }

  // Add subjects to existing teacher
  const handleAddSubjectsToTeacher = async () => {
    if (!selectedTeacherForSubjects || additionalSubjects.length === 0) {
      alert('Please select a teacher and at least one subject')
      return
    }

    // Prevent multiple clicks
    if (loadingStates['add-subjects']) return
    
    setLoadingStates(prev => ({ ...prev, 'add-subjects': true }))

    try {
      // Get current teacher data
      const teacherDoc = await getDoc(doc(db, 'teachers', selectedTeacherForSubjects.id))
      if (!teacherDoc.exists()) {
        alert('Teacher not found')
        return
      }

      const currentTeacher = teacherDoc.data()
      const currentSubjects = currentTeacher.subjects || []
      
      // Combine current subjects with new ones (avoid duplicates)
      const updatedSubjects = [...new Set([...currentSubjects, ...additionalSubjects])]
      
      // Update teacher document
      await updateDoc(doc(db, 'teachers', selectedTeacherForSubjects.id), {
        subjects: updatedSubjects,
        updatedAt: new Date()
      })
      
      // Reset form
      setSelectedTeacherForSubjects(null)
      setAdditionalSubjects([])
      setShowAddSubjects(false)
      
      // Show success state
      setSuccessStates(prev => ({ ...prev, 'add-subjects': true }))
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, 'add-subjects': false }))
      }, 2000)
      
      // Refresh admin data
      await loadAdminData()
      
      alert('Subjects added successfully!')
    } catch (error) {
      console.error('Error adding subjects to teacher:', error)
      alert('Error adding subjects. Please try again.')
    } finally {
      setLoadingStates(prev => ({ ...prev, 'add-subjects': false }))
    }
  }

  // Toggle subject selection for new teacher
  const toggleTeacherSubject = (subjectId) => {
    setNewTeacherSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  // Toggle subject selection for additional subjects
  const toggleAdditionalSubject = (subjectId) => {
    setAdditionalSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  // Open add subjects modal for existing teacher
  const openAddSubjectsModal = (teacher) => {
    setSelectedTeacherForSubjects(teacher)
    setAdditionalSubjects([])
    setShowAddSubjects(true)
  }

  // Remove teacher permission
  const removeTeacherPermission = async (teacherId) => {
    const loadingKey = `remove-teacher-${teacherId}`
    
    // Prevent multiple clicks
    if (loadingStates[loadingKey]) return
    
    console.log('Toggling note public status:', noteId, 'New status:', newPublicStatus)
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    
    try {
      await deleteDoc(doc(db, 'teachers', teacherId))
      await loadAdminData()
    } catch (error) {
      console.error('Error removing teacher permission:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Teacher panel functions
  const handleAddTopic = async () => {
    if (!newTopic.trim() || !newNoteContent.trim()) {
      alert('Please enter both topic name and content')
      return
    }

    // Prevent multiple clicks
    if (loadingStates['add-topic']) return
    
    setLoadingStates(prev => ({ ...prev, 'add-topic': true }))

    try {
      console.log('Adding topic with content:', newTopic, 'for subject:', currentSubjectPage)
      
      // Create the note with content directly
      await addDoc(collection(db, 'subjectNotes'), {
        subjectId: currentSubjectPage,
        title: newTopic,
        content: newNoteContent,
        topic: newTopic,
        isPublic: newNoteIsPublic,
        addedBy: user.uid,
        teacherName: user.displayName || user.email,
        addedAt: new Date()
      })
      
      console.log('Topic with content added successfully')
      
      // Reset form
      setNewTopic('')
      setNewNoteContent('')
      setNewNoteIsPublic(false)
      setShowAddTopic(false)
      
      // Force a complete refresh of the notes
      console.log('Refreshing notes after adding topic...')
      const notes = await loadSubjectNotes(currentSubjectPage, true) // Teacher view
      console.log('New notes loaded:', notes)
      setSubjectNotes(prev => ({ ...prev, [currentSubjectPage]: notes }))
      
      // Also refresh for students if they're viewing this subject
      if (subjectNotes[selectedSubject] && selectedSubject === currentSubjectPage) {
        const studentNotes = await loadSubjectNotes(currentSubjectPage, false)
        setSubjectNotes(prev => ({ ...prev, [currentSubjectPage]: studentNotes }))
      }
      
      // Show success state
      setSuccessStates(prev => ({ ...prev, 'add-topic': true }))
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, 'add-topic': false }))
      }, 2000)
      
      alert('Topic with content added successfully!')
    } catch (error) {
      console.error('Error adding topic:', error)
      alert('Error adding topic. Please try again.')
    } finally {
      setLoadingStates(prev => ({ ...prev, 'add-topic': false }))
    }
  }



  const handleEditNote = async () => {
    if (!editingNote || !newNoteContent.trim()) {
      alert('Please enter content')
      return
    }

    // Prevent multiple clicks
    if (loadingStates['edit-note']) return
    
    setLoadingStates(prev => ({ ...prev, 'edit-note': true }))

    try {
      // Update existing note
      await updateDoc(doc(db, 'subjectNotes', editingNote.id), {
        content: newNoteContent,
        isPublic: newNoteIsPublic,
        teacherName: user.displayName || user.email,
        updatedAt: new Date()
      })
      
      // Reset form
      setNewNoteContent('')
      setNewNoteIsPublic(true)
      setShowEditNote(false)
      setEditingNote(null)
      
      // Refresh notes for both teacher and student views
      const teacherNotes = await loadSubjectNotes(currentSubjectPage, true) // Teacher view
      const studentNotes = await loadSubjectNotes(currentSubjectPage, false) // Student view
      
      setSubjectNotes(prev => ({ 
        ...prev, 
        [currentSubjectPage]: teacherNotes,
        // Update student view if they're viewing this subject
        ...(selectedSubject === currentSubjectPage ? { [currentSubjectPage]: studentNotes } : {})
      }))
      

      
      // Show success state
      setSuccessStates(prev => ({ ...prev, 'edit-note': true }))
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, 'edit-note': false }))
      }, 2000)
      
      alert('Note updated successfully!')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Error updating note. Please try again.')
    } finally {
      setLoadingStates(prev => ({ ...prev, 'edit-note': false }))
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const loadingKey = `delete-${noteId}`
      
      // Prevent multiple clicks
      if (loadingStates[loadingKey]) return
      
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
      
      try {
        // Find the note to check if it's a placeholder
        const noteToDelete = subjectNotes[currentSubjectPage]?.find(n => n.id === noteId)
        
        if (noteToDelete?.isTopicPlaceholder) {
          // Delete the topic from Firestore
          await deleteDoc(doc(db, 'topics', noteToDelete.topicId))
        } else {
          // Delete the note from Firestore
          await deleteDoc(doc(db, 'subjectNotes', noteId))
        }
        
        // Refresh notes for both teacher and student views
        const teacherNotes = await loadSubjectNotes(currentSubjectPage, true) // Teacher view
        const studentNotes = await loadSubjectNotes(currentSubjectPage, false) // Student view
        
        setSubjectNotes(prev => ({ 
          ...prev, 
          [currentSubjectPage]: teacherNotes,
          // Update student view if they're viewing this subject
          ...(selectedSubject === currentSubjectPage ? { [currentSubjectPage]: studentNotes } : {})
        }))
        

        
        // Show success state
        setSuccessStates(prev => ({ ...prev, [loadingKey]: true }))
        
        // Hide success state after 2 seconds
        setTimeout(() => {
          setSuccessStates(prev => ({ ...prev, [loadingKey]: false }))
        }, 2000)
        
        alert('Note deleted successfully!')
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Error deleting note. Please try again.')
      } finally {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
      }
    }
  }

  const startEditNote = (note) => {
    setEditingNote(note)
    setNewNoteContent(note.content)
    setNewNoteIsPublic(note.isPublic !== false) // Default to true if not set
    setShowEditNote(true)
  }



  const openFullPageNote = (note) => {
    // Security check: prevent students from viewing private notes
    if (globalViewMode === 'student' && note.isPublic === false) {
      alert('Access denied: This note is private and not available for student viewing.')
      return
    }
    setFullPageNote(note)
  }

  const closeFullPageNote = () => {
    setFullPageNote(null)
  }

  // Rich text formatting functions
  const formatText = (format) => {
    const textarea = document.getElementById('topic-content') || document.getElementById('edit-note-content')
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'bullet':
        formattedText = `• ${selectedText}`
        break
      case 'number':
        formattedText = `1. ${selectedText}`
        break
      default:
        return
    }
    
    const newContent = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end)
    setNewNoteContent(newContent)
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const insertImage = () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL')
      return
    }
    
    const textarea = document.getElementById('topic-content') || document.getElementById('edit-note-content')
    if (!textarea) return
    
    const start = textarea.selectionStart
    const imageMarkdown = `\n![Image](${imageUrl})\n`
    
    const newContent = textarea.value.substring(0, start) + imageMarkdown + textarea.value.substring(start)
    setNewNoteContent(newContent)
    setImageUrl('')
    setShowImageInput(false)
    
    // Set cursor position after image
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length)
    }, 0)
  }

  const renderMarkdownContent = (content) => {
    if (!content) return ''
    
    // Simple markdown rendering
    let rendered = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/•\s*(.*?)(?=\n|$)/g, '<li>$1</li>') // Bullet points
      .replace(/\d+\.\s*(.*?)(?=\n|$)/g, '<li>$1</li>') // Numbered lists
      .replace(/!\[Image\]\((.*?)\)/g, '<img src="$1" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />') // Images
      .replace(/\n/g, '<br>') // Line breaks
    
    return rendered
  }

  // Questions functions
  const generateQuizCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const addQuestionToQuiz = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      alert('Please enter both question and answer')
      return
    }
    
    const newQuestion = {
      id: Date.now(),
      question: currentQuestion,
      answer: currentAnswer,
      marks: currentMarks
    }
    
    setQuizQuestions([...quizQuestions, newQuestion])
    setCurrentQuestion('')
    setCurrentAnswer('')
    setCurrentMarks(1)
  }

  const removeQuestionFromQuiz = (questionId) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId))
  }

  const createQuiz = async () => {
    if (!quizTitle.trim() || !quizSubject || quizQuestions.length === 0) {
      alert('Please enter quiz title, select subject, and add at least one question')
      return
    }
    
    const code = generateQuizCode()
    setQuizCode(code)
    setShowQuizCode(true)
    
    // Save quiz to Firestore
    try {
      await addDoc(collection(db, 'quizzes'), {
        title: quizTitle,
        subject: quizSubject,
        questions: quizQuestions,
        code: code,
        createdBy: user.uid,
        teacherName: user.displayName || user.email,
        createdAt: new Date(),
        isActive: true
      })
      
      // Reset form
      setQuizTitle('')
      setQuizSubject('')
      setQuizQuestions([])
      setShowCreateQuiz(false)
      
      // Refresh quizzes list
      loadAllQuizzes()
      
      showAlert('Quiz created successfully! Share the code with your students.', 'success')
    } catch (error) {
      console.error('Error creating quiz:', error)
      showAlert('Error creating quiz. Please try again.', 'error')
    }
  }

  const loadAllQuizzes = async () => {
    try {
      const quizzesSnapshot = await getDocs(collection(db, 'quizzes'))
      const quizzes = []
      quizzesSnapshot.forEach(doc => {
        quizzes.push({ id: doc.id, ...doc.data() })
      })
      setAllQuizzes(quizzes)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    }
  }

  const joinQuizWithCode = async () => {
    if (!studentQuizCode.trim()) {
      showAlert('Please enter a quiz code', 'warning')
      return
    }
    
    try {
      const quizQuery = query(collection(db, 'quizzes'), where('code', '==', studentQuizCode.toUpperCase()))
      const quizSnapshot = await getDocs(quizQuery)
      
      if (quizSnapshot.empty) {
        showAlert('Invalid quiz code. Please check and try again.', 'error')
        return
      }
      
      const quiz = { id: quizSnapshot.docs[0].id, ...quizSnapshot.docs[0].data() }
      setCurrentQuiz(quiz)
      setShowStudentQuiz(true)
      setStudentQuizCode('')
    } catch (error) {
      console.error('Error joining quiz:', error)
      showAlert('Error joining quiz. Please try again.', 'error')
    }
  }

  const submitQuiz = async () => {
    if (Object.keys(studentAnswers).length === 0) {
      showAlert('Please answer at least one question before submitting.', 'warning')
      return
    }

    if (isSubmittingQuiz) {
      showAlert('Please wait, your quiz is being submitted...', 'info')
      return
    }

    setIsSubmittingQuiz(true)

    try {
      // Save each answer as a separate submission
      const submissionPromises = currentQuiz.questions.map(async (q) => {
        const studentAnswer = studentAnswers[q.id] || ''
        
        if (studentAnswer.trim()) {
          const submission = {
            quizId: currentQuiz.id,
            questionId: q.id,
            studentId: user.uid,
            studentName: user.displayName || user.email,
            answer: studentAnswer,
            submittedAt: new Date(),
            marked: false,
            aiMarked: false
          }
          
          return await addDoc(collection(db, 'quizSubmissions'), submission)
        }
        return null
      })

      await Promise.all(submissionPromises.filter(p => p !== null))
      
      showAlert('Quiz submitted successfully! Your teacher will mark it and you can view results in the "View Results" tab.', 'success')
      
      // Reset the quiz interface
      setCurrentQuiz(null)
      setShowStudentQuiz(false)
      setStudentAnswers({})
      
      // Refresh student submissions
      if (user && !isTeacher) {
        loadStudentSubmissions(false) // Don't show view automatically
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      showAlert('Error submitting quiz. Please try again.', 'error')
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  const resetQuiz = () => {
    setCurrentQuiz(null)
    setShowStudentQuiz(false)
    setStudentAnswers({})
    setQuizResults(null)
  }

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteDoc(doc(db, 'quizzes', quizId))
      
      // Remove from local state
      setAllQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
      
      showAlert('Quiz deleted successfully!', 'success')
    } catch (error) {
      console.error('Error deleting quiz:', error)
      showAlert('Error deleting quiz. Please try again.', 'error')
    }
  }

  const saveAIConfiguration = async () => {
    try {
      await setDoc(doc(db, 'aiConfiguration', user.uid), {
        openAIKey: openAIKey,
        useAIMarking: useAIMarking,
        aiMarkingPrompt: aiMarkingPrompt,
        updatedAt: new Date()
      })
      
      showAlert('AI configuration saved successfully!', 'success')
      setShowAIConfig(false)
    } catch (error) {
      console.error('Error saving AI configuration:', error)
      showAlert('Error saving AI configuration. Please try again.', 'error')
    }
  }

  const loadAIConfiguration = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'aiConfiguration', user.uid))
      if (configDoc.exists()) {
        const config = configDoc.data()
        setOpenAIKey(config.openAIKey || '')
        setUseAIMarking(config.useAIMarking || false)
        setAiMarkingPrompt(config.aiMarkingPrompt || '')
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error)
    }
  }

  const testOpenAIConnection = async () => {
    if (!openAIKey.trim()) {
      showAlert('Please enter your OpenAI API key first', 'warning')
      return
    }
    
    try {
      // Test the API key with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        showAlert('✅ OpenAI API connection successful! Your API key is valid.', 'success')
      } else {
        showAlert('❌ OpenAI API connection failed. Please check your API key.', 'error')
      }
    } catch (error) {
      console.error('Error testing OpenAI connection:', error)
      showAlert('❌ Error testing OpenAI connection. Please check your internet connection and API key.', 'error')
    }
  }

  const loadStudentSubmissions = async (showView = true) => {
    try {
      const submissionsRef = collection(db, 'quizSubmissions')
      const q = query(submissionsRef, orderBy('submittedAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const submissions = []
      querySnapshot.forEach((doc) => {
        submissions.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setStudentSubmissions(submissions)
      if (showView) {
        setShowStudentSubmissions(true)
      }
    } catch (error) {
      console.error('Error loading student submissions:', error)
      alert('Error loading student submissions. Please try again.')
    }
  }

  const viewQuizSubmissions = async (quizId) => {
    if (isLoadingViewSubmissions) return
    
    setIsLoadingViewSubmissions(true)
    
    try {
      console.log('Loading submissions for quiz:', quizId)
      console.log('Current user:', user?.uid)
      console.log('Is teacher:', isTeacher)
      
      if (!quizId) {
        alert('Quiz ID is missing. Please try again.')
        return
      }
      
      const submissionsRef = collection(db, 'quizSubmissions')
      console.log('Collection reference created')
      
      // First try with orderBy, if it fails, get without ordering
      let querySnapshot
      try {
        console.log('Trying query with orderBy...')
        const q = query(
          submissionsRef, 
          where('quizId', '==', quizId),
          orderBy('submittedAt', 'desc')
        )
        querySnapshot = await getDocs(q)
        console.log('Query with orderBy successful')
      } catch (orderError) {
        console.log('OrderBy failed, getting without ordering:', orderError.message)
        try {
          const q = query(
            submissionsRef, 
            where('quizId', '==', quizId)
          )
          querySnapshot = await getDocs(q)
          console.log('Query without orderBy successful')
        } catch (queryError) {
          console.error('Query failed completely:', queryError.message)
          // Check if collection exists by trying to get all docs
          try {
            const allDocs = await getDocs(submissionsRef)
            console.log('Collection exists, total docs:', allDocs.size)
            if (allDocs.size === 0) {
              alert('No submissions found for this quiz yet.')
              return
            }
            // Filter manually
            const allSubmissions = []
            allDocs.forEach(doc => {
              const data = doc.data()
              if (data.quizId === quizId) {
                allSubmissions.push({
                  id: doc.id,
                  ...data,
                  submittedAt: data.submittedAt || new Date()
                })
              }
            })
            console.log('Manually filtered submissions:', allSubmissions.length)
            if (allSubmissions.length === 0) {
              alert('No submissions found for this quiz yet.')
              return
            }
            setStudentSubmissions(allSubmissions)
            setShowStudentSubmissions(true)
            return
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError.message)
            throw new Error(`Failed to load submissions: ${fallbackError.message}`)
          }
        }
      }
      
      console.log('Query snapshot size:', querySnapshot.size)
      
      const submissions = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Document data:', data)
        submissions.push({
          id: doc.id,
          ...data,
          // Ensure submittedAt exists, fallback to current time if not
          submittedAt: data.submittedAt || new Date()
        })
      })
      
      // Sort manually if orderBy failed
      submissions.sort((a, b) => {
        const dateA = a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt)
        const dateB = b.submittedAt instanceof Date ? b.submittedAt : new Date(b.submittedAt)
        return dateB - dateA
      })
      
      console.log('Final submissions array:', submissions)
      console.log('Loaded submissions count:', submissions.length)
      
      if (submissions.length === 0) {
        alert('No submissions found for this quiz yet.')
        return
      }
      
      setStudentSubmissions(submissions)
      setShowStudentSubmissions(true)
      console.log('State updated successfully')
    } catch (error) {
      console.error('Error loading quiz submissions:', error)
      console.error('Error stack:', error.stack)
      alert(`Error loading quiz submissions: ${error.message}`)
    } finally {
      setIsLoadingViewSubmissions(false)
    }
  }

  const viewStudentSubmissions = (studentId) => {
    if (isLoadingViewAnswers) return
    
    setIsLoadingViewAnswers(true)
    
    try {
      // Find any submission from this student to get their name
      const studentSubmission = studentSubmissions.find(sub => sub.studentId === studentId)
      if (!studentSubmission) {
        console.error('Student submission not found:', studentId)
        alert('Student data not found. Please try refreshing the submissions.')
        return
      }
      
      // Group all submissions for this student
      const studentSubs = studentSubmissions.filter(sub => sub.studentId === studentId)
      const totalScore = studentSubs.filter(sub => sub.marked).reduce((sum, sub) => sum + (sub.score || 0), 0)
      const maxScore = studentSubs.reduce((sum, sub) => {
        const quiz = allQuizzes.find(q => q.id === sub.quizId)
        const question = quiz?.questions.find(q => q.id === sub.questionId)
        return sum + (question?.marks || 0)
      }, 0)
      const markedCount = studentSubs.filter(sub => sub.marked).length
      
      setSelectedStudent({
        studentId: studentId,
        studentName: studentSubmission.studentName || 'Anonymous',
        submissions: studentSubs,
        totalScore: totalScore,
        maxScore: maxScore,
        markedCount: markedCount,
        totalSubmissions: studentSubs.length
      })
      setShowIndividualStudent(true)
    } catch (error) {
      console.error('Error viewing student submissions:', error)
      alert('Error loading student data. Please try again.')
    } finally {
      setIsLoadingViewAnswers(false)
    }
  }

  const refreshSelectedStudentData = () => {
    if (selectedStudent) {
      viewStudentSubmissions(selectedStudent.studentId)
    }
  }

  const handleStudentSubjectSelection = (subjectId, isHL) => {
    setStudentSelectedSubjects(prev => {
      const existingSubject = prev.find(sub => sub.subjectId === subjectId)
      
      if (existingSubject) {
        // If subject already exists, toggle HL status or remove if same level
        if (existingSubject.isHL === isHL) {
          // Remove subject if clicking same level
          return prev.filter(sub => sub.subjectId !== subjectId)
        } else {
          // Change level (SL to HL or HL to SL)
          return prev.map(sub => 
            sub.subjectId === subjectId 
              ? { ...sub, isHL: isHL }
              : sub
          )
        }
      } else {
        // Add new subject
        const newSubject = { subjectId, isHL }
        
        // Check IB constraints after adding the new subject
        const newHLCount = isHL ? prev.filter(sub => sub.isHL).length + 1 : prev.filter(sub => sub.isHL).length
        const newSLCount = !isHL ? prev.filter(sub => !sub.isHL).length + 1 : prev.filter(sub => !sub.isHL).length
        const newTotalCount = prev.length + 1
        
        if (newHLCount > 4) {
          showAlert('You can only select a maximum of 4 HL subjects.', 'warning')
          return prev
        }
        
        if (newSLCount > 3) {
          showAlert('You can only select a maximum of 3 SL subjects.', 'warning')
          return prev
        }
        
        if (newTotalCount > 6) {
          showAlert('You can only select a maximum of 6 subjects total.', 'warning')
          return prev
        }
        
        return [...prev, newSubject]
      }
    })
  }

  const getSubjectSelectionStatus = () => {
    const hlCount = studentSelectedSubjects.filter(sub => sub.isHL).length
    const slCount = studentSelectedSubjects.filter(sub => !sub.isHL).length
    const totalCount = studentSelectedSubjects.length
    
    return {
      hlCount,
      slCount,
      totalCount,
      canAddMore: totalCount < 6,
      canAddHL: hlCount < 4,
      canAddSL: slCount < 3,
      meetsMinimum: totalCount >= 6 && hlCount >= 3 && slCount >= 2
    }
  }

  const saveStudentSubjectSelection = async () => {
    const status = getSubjectSelectionStatus()
    
    if (!status.meetsMinimum) {
      showAlert('You must select 6 subjects total: at least 3 HL and 2 SL subjects to continue.', 'warning')
      return
    }
    
    try {
      // Save to user's profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        selectedSubjects: studentSelectedSubjects,
        subjectSelectionCompleted: true,
        updatedAt: new Date()
      })
      
      showAlert('Subject selection saved successfully!', 'success')
      setShowSubjectSelection(false)
      
      // Optionally refresh user data or redirect
    } catch (error) {
      console.error('Error saving subject selection:', error)
      showAlert('Error saving subject selection. Please try again.', 'error')
    }
  }

  const loadStudentSubjectSelection = async () => {
    if (!user) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.selectedSubjects) {
          setStudentSelectedSubjects(userData.selectedSubjects)
        }
      }
    } catch (error) {
      console.error('Error loading student subject selection:', error)
    }
  }

  // Button state management functions
  const setButtonLoading = (buttonId, isLoading) => {
    setButtonLoadingStates(prev => ({
      ...prev,
      [buttonId]: isLoading
    }))
  }

  const setButtonSuccess = (buttonId, isSuccess) => {
    setButtonSuccessStates(prev => ({
      ...prev,
      [buttonId]: isSuccess
    }))
    
    // Auto-reset success state after animation
    if (isSuccess) {
      setTimeout(() => {
        setButtonSuccessStates(prev => ({
          ...prev,
          [buttonId]: false
        }))
      }, 1000)
    }
  }

  const handleButtonClick = async (buttonId, action) => {
    if (buttonLoadingStates[buttonId]) return // Prevent multiple clicks
    
    setButtonLoading(buttonId, true)
    try {
      await action()
      setButtonSuccess(buttonId, true)
    } catch (error) {
      console.error('Button action failed:', error)
    } finally {
      setButtonLoading(buttonId, false)
    }
  }

  // Custom notification system
  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove notification after duration
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Replace alert function with smart type detection
  const showAlert = (message, type = 'auto') => {
    if (type === 'auto') {
      // Auto-detect notification type based on message content
      if (message.includes('successfully') || message.includes('✅') || message.includes('Success')) {
        type = 'success'
      } else if (message.includes('Error') || message.includes('❌') || message.includes('failed') || message.includes('denied')) {
        type = 'error'
      } else if (message.includes('Warning') || message.includes('⚠️') || message.includes('Please') || message.includes('must')) {
        type = 'warning'
      } else {
        type = 'info'
      }
    }
    showNotification(message, type)
  }

  const markSubmissionWithAI = async (submission) => {
    // Check if user is admin or if API key is already configured
    if (!isAdmin && (!openAIKey.trim() || !useAIMarking)) {
      showAlert('AI marking is only available to admins or teachers with pre-configured API keys.', 'warning')
      return
    }

    // Check if already loading for this submission
    if (isLoadingAIMarking[submission.id]) {
      return null
    }

    // Set loading state for this specific submission
    setIsLoadingAIMarking(prev => ({ ...prev, [submission.id]: true }))

    try {
      const quiz = allQuizzes.find(q => q.id === submission.quizId)
      if (!quiz) {
        showAlert('Quiz not found for this submission.', 'error')
        return null
      }

      const markingPrompt = aiMarkingPrompt || 'Mark this answer fairly and provide constructive feedback. Award marks based on accuracy and completeness.'
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert teacher marking a quiz. ${markingPrompt}`
            },
            {
              role: 'user',
              content: `Quiz: ${quiz.title}\nSubject: ${quiz.subject}\n\nQuestion: ${quiz.questions.find(q => q.id === submission.questionId)?.question}\nExpected Answer: ${quiz.questions.find(q => q.id === submission.questionId)?.answer}\nStudent Answer: ${submission.answer}\nMaximum Marks: ${quiz.questions.find(q => q.id === submission.questionId)?.marks}\n\nPlease provide: 1) Score out of maximum marks, 2) Detailed feedback explaining the score, 3) Suggestions for improvement. Format as JSON: {"score": X, "feedback": "text", "suggestions": "text"}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error('OpenAI API request failed')
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content
      
      try {
        const parsedResponse = JSON.parse(aiResponse)
        return {
          score: parsedResponse.score,
          feedback: parsedResponse.feedback,
          suggestions: parsedResponse.suggestions
        }
      } catch (parseError) {
        // If AI response isn't valid JSON, extract score manually
        const scoreMatch = aiResponse.match(/score["\s:]+(\d+)/i)
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0
        return {
          score: score,
          feedback: aiResponse,
          suggestions: 'AI provided feedback but format was unexpected.'
        }
      }
    } catch (error) {
      console.error('Error marking with AI:', error)
      showAlert('Error marking with AI. Please try manual marking instead.', 'error')
      return null
    } finally {
      // Clear loading state for this submission
      setIsLoadingAIMarking(prev => ({ ...prev, [submission.id]: false }))
    }
  }

  const markAllSubmissionsWithAI = async () => {
    if (isLoadingMarkAllAI) return
    
    // Check if user is admin or if API key is already configured
    if (!isAdmin && (!useAIMarking || !openAIKey.trim())) {
      showAlert('AI marking is only available to admins or teachers with pre-configured API keys.', 'warning')
      return
    }

    if (!window.confirm('This will mark all unmarked submissions with AI. Continue?')) {
      return
    }

    const unmarkedSubmissions = studentSubmissions.filter(sub => !sub.marked)
    if (unmarkedSubmissions.length === 0) {
      showAlert('No unmarked submissions found.', 'info')
      return
    }

    setIsLoadingMarkAllAI(true)

    let processed = 0
    let errors = 0

    try {
      for (const submission of unmarkedSubmissions) {
        try {
          const aiResult = await markSubmissionWithAI(submission)
          if (aiResult) {
            // Update submission with AI marking
            await updateDoc(doc(db, 'quizSubmissions', submission.id), {
              marked: true,
              aiMarked: true,
              score: aiResult.score,
              feedback: aiResult.feedback,
              suggestions: aiResult.suggestions,
              markedAt: new Date(),
              markedBy: user.uid
            })
            
            // Update local state instead of refreshing
            setStudentSubmissions(prev => prev.map(sub => 
              sub.id === submission.id 
                ? { ...sub, ...aiResult, marked: true, aiMarked: true, markedAt: new Date(), markedBy: user.uid }
                : sub
            ))
            
            processed++
          } else {
            errors++
          }
        } catch (error) {
          console.error(`Error marking submission ${submission.id}:`, error)
          errors++
        }
      }

      showAlert(`AI marking completed!\nProcessed: ${processed}\nErrors: ${errors}`, 'success')
      // No need to refresh - local state is already updated
    } catch (error) {
      console.error('Error in mark all submissions:', error)
      showAlert('Error marking submissions with AI. Please try again.', 'error')
    } finally {
      setIsLoadingMarkAllAI(false)
    }
  }

  const saveManualMarking = async (submissionId) => {
    // Check if already loading for this submission
    if (isLoadingManualMarking[submissionId]) return
    
    // Set loading state for this specific submission
    setIsLoadingManualMarking(prev => ({ ...prev, [submissionId]: true }))
    
    try {
      const marking = manualMarking[submissionId]
      if (!marking) return

      await updateDoc(doc(db, 'quizSubmissions', submissionId), {
        marked: true,
        aiMarked: false,
        score: marking.score,
        feedback: marking.feedback,
        suggestions: marking.suggestions,
        markedAt: new Date(),
        markedBy: user.uid
      })

      // Update local state
      setStudentSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, ...marking, marked: true, aiMarked: false, markedAt: new Date(), markedBy: user.uid }
          : sub
      ))

      setManualMarking(prev => {
        const newMarking = { ...prev }
        delete newMarking[submissionId]
        return newMarking
      })
      
      showAlert('Manual marking saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving manual marking:', error)
      showAlert('Error saving manual marking. Please try again.', 'error')
    } finally {
      // Clear loading state for this submission
      setIsLoadingManualMarking(prev => ({ ...prev, [submissionId]: false }))
    }
  }

  const toggleNotePublic = async (noteId, newPublicStatus) => {
    const loadingKey = `toggle-${noteId}`
    
    // Prevent multiple clicks
    if (loadingStates[loadingKey]) return
    

    
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    
    try {
      await updateDoc(doc(db, 'subjectNotes', noteId), {
        isPublic: newPublicStatus,
        updatedAt: new Date()
      })
      
      console.log('Note updated successfully')
      
      // Refresh notes for both teacher and student views
      const teacherNotes = await loadSubjectNotes(currentSubjectPage, true) // Teacher view
      const studentNotes = await loadSubjectNotes(currentSubjectPage, false) // Student view
      
      setSubjectNotes(prev => ({ 
        ...prev, 
        [currentSubjectPage]: teacherNotes,
        // Update student view if they're viewing this subject
        ...(selectedSubject === currentSubjectPage ? { [currentSubjectPage]: studentNotes } : {})
      }))
      
      // Show success state
      setSuccessStates(prev => ({ ...prev, [loadingKey]: true }))
      
      // Hide success state after 2 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, [loadingKey]: false }))
      }, 2000)
      
      // Show success message with correct status
      const statusText = newPublicStatus ? 'public' : 'private'
      showAlert(`Note made ${statusText} successfully!`, 'success')
    } catch (error) {
      console.error('Error toggling note public status:', error)
      showAlert('Error updating note status. Please try again.', 'error')
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Navigate to subject page
  const navigateToSubject = async (subjectId) => {
    setCurrentSubjectPage(subjectId)
    const notes = await loadSubjectNotes(subjectId, isTeacher && teacherSubjects.includes(subjectId))
    setSubjectNotes(prev => ({ ...prev, [subjectId]: notes }))
  }

  // Go back to main notes view
  const goBackToNotes = () => {
    setCurrentSubjectPage(null)
  }

  // Debug function to manually refresh notes
  const debugRefreshNotes = async () => {
    if (!currentSubjectPage) {
      showAlert('Please select a subject first', 'warning')
      return
    }
    
    console.log('Manual refresh triggered for subject:', currentSubjectPage)
    try {
      const notes = await loadSubjectNotes(currentSubjectPage, isTeacher && teacherSubjects.includes(currentSubjectPage))
      console.log('Debug refresh result:', notes)
      setSubjectNotes(prev => ({ ...prev, [currentSubjectPage]: notes }))
      showAlert(`Refreshed notes. Found ${notes.length} notes.`, 'success')
    } catch (error) {
      console.error('Debug refresh error:', error)
      showAlert('Error refreshing notes: ' + error.message, 'error')
    }
  }

  // Debug function to check database status
  const debugCheckDatabase = async () => {
    try {
      console.log('Checking database status...')
      
      // Check subjectNotes collection
      const notesSnapshot = await getDocs(collection(db, 'subjectNotes'))
      console.log('Total notes in database:', notesSnapshot.size)
      
      // Check topics collection
      const topicsSnapshot = await getDocs(collection(db, 'topics'))
      console.log('Total topics in database:', topicsSnapshot.size)
      
      // Show first few notes
      const firstNotes = []
      notesSnapshot.forEach((doc, index) => {
        if (index < 3) {
          firstNotes.push({ id: doc.id, ...doc.data() })
        }
      })
      console.log('First few notes:', firstNotes)
      
      showAlert(`Database Status:\nNotes: ${notesSnapshot.size}\nTopics: ${topicsSnapshot.size}\nCheck console for details.`, 'info')
    } catch (error) {
      console.error('Database check error:', error)
      showAlert('Error checking database: ' + error.message, 'error')
    }
  }

  // Function to clear all notes from database
  const clearAllNotes = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL notes and topics from the database!\n\nThis action cannot be undone. Are you sure you want to continue?')) {
      return
    }

    try {
      setContentLoading(prev => ({ ...prev, allSubjects: true }))
      console.log('Starting database cleanup...')
      
      // Clear all notes
      const notesSnapshot = await getDocs(collection(db, 'subjectNotes'))
      const noteDeletePromises = notesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(noteDeletePromises)
      console.log(`Deleted ${notesSnapshot.size} notes`)
      
      // Clear all topics
      const topicsSnapshot = await getDocs(collection(db, 'topics'))
      const topicDeletePromises = topicsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(topicDeletePromises)
      console.log(`Deleted ${topicsSnapshot.size} topics`)
      
      // Clear local state completely
      setSubjectNotes({})
      
      // Force refresh of all subjects to clear any cached data
      const allSubjects = subjectBlocks.flatMap(block => block.subjects)
      allSubjects.forEach(subjectId => {
        setSubjectNotes(prev => ({ ...prev, [subjectId]: [] }))
      })
      
      showAlert(`✅ Database cleared successfully!\n\nDeleted:\n- ${notesSnapshot.size} notes\n- ${topicsSnapshot.size} topics\n\nAll cached data has been cleared.`, 'success')
    } catch (error) {
      console.error('Error clearing database:', error)
      showAlert('Error clearing database: ' + error.message, 'error')
    } finally {
      setContentLoading(prev => ({ ...prev, allSubjects: false }))
    }
  }

  const loadUserSubjects = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists() && userDoc.data().selectedSubjects) {
        const subjects = userDoc.data().selectedSubjects
        setSelectedSubjects(subjects)
        // Set the first selected subject as the default for notes
        if (subjects.length > 0) {
          setSelectedSubject(subjects[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading user subjects:', error)
    }
  }

  const saveUserSubjects = async (subjects) => {
    if (!user) return
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL || null,
        selectedSubjects: subjects,
        lastUpdated: new Date()
      }, { merge: true })
    } catch (error) {
      console.error('Error saving user subjects:', error)
    }
  }

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      setAuthError(error.message)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthError('')
    setIsGoogleSigningIn(true)
    
    try {
      const result = await signInWithPopup(auth, googleProvider)
      // Google sign-in successful - user will be handled by onAuthStateChanged
    } catch (error) {
      setAuthError(error.message)
      setIsGoogleSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setSelectedSubjects([])
      setActiveTab('login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setAuthError('Please enter your email first')
      return
    }
    
    try {
      await sendPasswordResetEmail(auth, email)
      setIsResettingPassword(true)
      setAuthError('Password reset email sent! Check your inbox.')
    } catch (error) {
      setAuthError(error.message)
    }
  }

  // Theme switching
  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    document.body.classList.toggle('dark-mode', newMode)
    localStorage.setItem('ib-study-hub-theme', newMode ? 'dark' : 'light')
  }

  // Reset subjects for a specific block
  const resetBlockSubjects = async (blockName) => {
    const blockSubjects = subjectBlocks.find(block => block.name === blockName)?.subjects || []
    const blockSubjectIds = blockSubjects.map(s => s.id)
    
    const newSelectedSubjects = selectedSubjects.filter(s => !blockSubjectIds.includes(s.id))
    setSelectedSubjects(newSelectedSubjects)
    await saveUserSubjects(newSelectedSubjects)
  }

  // Admin functions
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const loadingKey = `delete-user-${userId}`
      
      // Prevent multiple clicks
      if (loadingStates[loadingKey]) return
      
      setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
      
      try {
        await deleteDoc(doc(db, 'users', userId))
        await loadAdminData()
      } catch (error) {
        console.error('Error deleting user:', error)
      } finally {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
      }
    }
  }

  const subjectBlocks = [
    {
      name: 'Block 1 - Language & Literature',
      subjects: [
        { id: 'english-literature', name: 'English Literature', color: '#E91E63', levels: ['HL', 'SL'] },
        { id: 'english-language-literature', name: 'English Language & Literature', color: '#9C27B0', levels: ['HL', 'SL'] }
      ]
    },
    {
      name: 'Block 2 - Language Acquisition',
      subjects: [
        { id: 'french', name: 'French', color: '#2196F3', levels: ['HL', 'SL'] },
        { id: 'french-ab-initio', name: 'French Ab Initio', color: '#03A9F4', levels: ['HL', 'SL'] },
        { id: 'spanish', name: 'Spanish', color: '#4CAF50', levels: ['HL', 'SL'] },
        { id: 'spanish-ab-initio', name: 'Spanish Ab Initio', color: '#8BC34A', levels: ['HL', 'SL'] }
      ]
    },
    {
      name: 'Block 3 - Individuals & Societies',
      subjects: [
        { id: 'economics', name: 'Economics', color: '#795548', levels: ['HL', 'SL'] },
        { id: 'history', name: 'History', color: '#607D8B', levels: ['HL', 'SL'] },
        { id: 'psychology', name: 'Psychology', color: '#FF9800', levels: ['HL', 'SL'] }
      ]
    },
    {
      name: 'Block 4 - Sciences',
      subjects: [
        { id: 'biology', name: 'Biology', color: '#4CAF50', levels: ['HL', 'SL'] },
        { id: 'environmental-systems', name: 'Environmental Systems & Societies', color: '#8BC34A', levels: ['HL', 'SL'] },
        { id: 'physics', name: 'Physics', color: '#FF9800', levels: ['HL', 'SL'] }
      ]
    },
    {
      name: 'Block 5 - Mathematics',
      subjects: [
        { id: 'maths-analysis', name: 'Maths: Analysis & Approaches', color: '#9C27B0', levels: ['HL', 'SL'] },
        { id: 'maths-applications', name: 'Maths: Applications & Interpretation', color: '#673AB7', levels: ['HL', 'SL'] }
      ]
    },
    {
      name: 'Block 6 - Additional Subjects',
      subjects: [
        { id: 'chemistry', name: 'Chemistry', color: '#2196F3', levels: ['HL', 'SL'] },
        { id: 'business-management', name: 'Business Management', color: '#795548', levels: ['HL', 'SL'] },
        { id: 'geography', name: 'Geography', color: '#607D8B', levels: ['HL', 'SL'] },
        { id: 'computer-science', name: 'Computer Science', color: '#FF5722', levels: ['HL', 'SL'] }
      ]
    }
  ]



  const handleAIFeedback = async () => {
    if (question.trim()) {
      // Simulate AI feedback
      const feedbacks = [
        "Excellent answer! You've demonstrated a strong understanding of the concept. Consider adding more specific examples to strengthen your response.",
        "Good work! Your answer shows understanding, but try to be more precise with your terminology and include relevant formulas.",
        "You're on the right track. Review the key concepts and ensure you're addressing all parts of the question."
      ]
      const selectedFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]
      setFeedback(selectedFeedback)

      // Save feedback to Firestore if user is authenticated
      if (user) {
        try {
          await addDoc(collection(db, 'feedback'), {
            userId: user.uid,
            userEmail: user.email,
            subject: selectedSubject,
            question: question,
            feedback: selectedFeedback,
            timestamp: new Date()
          })
        } catch (error) {
          console.error('Error saving feedback:', error)
        }
      }
    }
  }

  const getSubjectNotes = async (subjectId) => {
    // Load notes from Firestore for students (only public notes)
    try {
      const notes = await loadSubjectNotes(subjectId, false) // false = student view
      return notes
    } catch (error) {
      console.error('Error loading notes for students:', error)
      // Return empty array if no notes found
      return []
    }
  }

  const toggleSubjectSelection = async (subjectId, level, blockName) => {
    const existingIndex = selectedSubjects.findIndex(s => s.id === subjectId && s.level === level)
    
    if (existingIndex >= 0) {
      // Remove subject
      const newSelectedSubjects = selectedSubjects.filter((_, index) => index !== existingIndex)
      setSelectedSubjects(newSelectedSubjects)
      await saveUserSubjects(newSelectedSubjects)
    } else {
      // Check if another subject from the same block is already selected
      const blockSubjects = subjectBlocks.find(block => block.name === blockName)?.subjects || []
      const blockSubjectIds = blockSubjects.map(s => s.id)
      
      // Remove any existing subjects from the same block
      const subjectsFromOtherBlocks = selectedSubjects.filter(s => !blockSubjectIds.includes(s.id))
      
      // Add new subject
      const subject = subjectBlocks.flatMap(block => block.subjects).find(s => s.id === subjectId)
      const newSelectedSubjects = [...subjectsFromOtherBlocks, { id: subjectId, name: subject.name, level, color: subject.color }]
      
      // Check IB constraints
      const newHLCount = newSelectedSubjects.filter(s => s.level === 'HL').length
      const newSLCount = newSelectedSubjects.filter(s => s.level === 'SL').length
      const newTotalCount = newSelectedSubjects.length
      
      if (newHLCount > 4) {
        alert('You can only select a maximum of 4 HL subjects.')
        return
      }
      
      if (newSLCount > 3) {
        alert('You can only select a maximum of 3 SL subjects.')
        return
      }
      
      if (newTotalCount > 6) {
        alert('You can only select a maximum of 6 subjects total.')
        return
      }
      
      setSelectedSubjects(newSelectedSubjects)
      await saveUserSubjects(newSelectedSubjects)
    }
  }

  const isSubjectSelected = (subjectId, level) => {
    return selectedSubjects.some(s => s.id === subjectId && s.level === level)
  }

  const getSelectedSubjectFromBlock = (blockName) => {
    const blockSubjects = subjectBlocks.find(block => block.name === blockName)?.subjects || []
    const blockSubjectIds = blockSubjects.map(s => s.id)
    return selectedSubjects.find(s => blockSubjectIds.includes(s.id))
  }

  if (loading) {
    return (
      <div className={`loading-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="loading-spinner"></div>
        <p>Loading IB Study Hub...</p>
      </div>
    )
  }

  // Login/Signup Page
  if (activeTab === 'login') {
    return (
      <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo">
                <div className="logo-icon">
                  <div className="graduation-cap">🎓</div>
                </div>
                <h1>IB STUDY HUB</h1>
              </div>
              <p className="auth-subtitle">Sign in to access your personalized study experience</p>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              {authError && <div className="auth-error">{authError}</div>}

              <button type="submit" className="auth-btn">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button 
                type="button" 
                className="google-auth-btn"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSigningIn}
              >
                {isGoogleSigningIn ? (
                  <div className="google-loading">
                    <div className="google-spinner"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="google-icon" />
                    Sign in with Google
                  </>
                )}
              </button>

              <div className="auth-links">
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
                
                {!isSignUp && (
                  <button 
                    type="button" 
                    className="link-btn"
                    onClick={handlePasswordReset}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>

            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">
            <div className="graduation-cap">🎓</div>
          </div>
          <h1>IB STUDY HUB</h1>
        </div>
        
        <div className="header-controls">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          

          
          <nav className="nav">
            <button 
              className={`nav-btn ${activeTab === 'subjects' ? 'active' : ''}`}
              onClick={() => setActiveTab('subjects')}
            >
              📚 My Subjects
            </button>
            <button 
              className={`nav-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              📖 Study Notes
            </button>
            <button 
              className={`nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 Questions
            </button>
            {isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
              <button 
                className={`nav-btn ${activeTab === 'teacher' ? 'active' : ''}`}
                onClick={() => setActiveTab('teacher')}
              >
              👨‍🏫 Teacher Panel
              </button>
            )}
            {isAdmin && (
              <button 
                className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
              👑 Admin Panel
              </button>
            )}
          </nav>
          
          <div className="user-controls">
            {user?.photoURL && (
              <img src={user.photoURL} alt="Profile" className="user-avatar" />
            )}
            <span className="user-email">{user?.displayName || user?.email}</span>
            <button className="signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Custom Notifications - Popup Toast Style */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              <span className="notification-icon">
                {notification.type === 'success' ? '✅' : 
                 notification.type === 'error' ? '❌' : 
                 notification.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="notification-message">{notification.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation()
                removeNotification(notification.id)
              }}
              title="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Global View Mode Toggle - Bottom Left */}
        {user && (
          <div className="global-view-toggle-bottom">
            <div className="view-toggle-container">
              <span className="view-label">View:</span>
              <div className="view-toggle-buttons">
                {/* Normal mode - Admin only */}
                {isAdmin && (
                  <button 
                    className={`view-toggle-btn ${globalViewMode === 'normal' ? 'active' : ''}`}
                    onClick={() => setGlobalViewMode('normal')}
                    title="Normal view - admin system management"
                  >
                    🌐 Normal
                  </button>
                )}
                
                {/* Teacher mode - Teachers and Admins only */}
                {(isTeacher || isAdmin) && (
                  <button 
                    className={`view-toggle-btn ${globalViewMode === 'teacher' ? 'active' : ''}`}
                    onClick={() => setGlobalViewMode('teacher')}
                    title="Switch to teacher view"
                  >
                    👨‍🏫 Teacher
                  </button>
                )}
                
                {/* Student mode - Everyone can access */}
                <button 
                  className={`view-toggle-btn ${globalViewMode === 'student' ? 'active' : ''}`}
                  onClick={() => setGlobalViewMode('student')}
                  title="Switch to student view"
                >
                  👨‍🎓 Student
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Subject Selection */}
        {activeTab === 'subjects' && (
          <div className="subjects-section">
            <h2>Select Your IB Subjects</h2>
            <p className="subjects-instruction">Choose your subjects from each block. You need 6 subjects total (3-4 HL, 2-3 SL). Only one subject per block allowed.</p>
            
            <div className="subject-blocks">
              {subjectBlocks.map((block, blockIndex) => {
                const selectedSubjectFromBlock = getSelectedSubjectFromBlock(block.name)
                return (
                  <div key={blockIndex} className="subject-block">
                    <div className="block-header">
                      <h3 className="block-title">{block.name}</h3>
                      {selectedSubjectFromBlock && (
                        <button 
                          className="reset-block-btn"
                          onClick={() => resetBlockSubjects(block.name)}
                          title="Reset this block's selection"
                        >
                          🔄 Reset
                        </button>
                      )}
                    </div>
                    
                    {selectedSubjectFromBlock && (
                      <div className="block-selected-indicator">
                        <span>Selected: {selectedSubjectFromBlock.name} ({selectedSubjectFromBlock.level})</span>
                      </div>
                    )}
                    
                    <div className="block-subjects">
                      {block.subjects.map((subject) => (
                        <div key={subject.id} className="subject-item">
                          <div className="subject-info">
                            <span className="subject-name">{subject.name}</span>
                          </div>
                          <div className="level-buttons">
                            {subject.levels.map((level) => (
                              <button
                                key={level}
                                className={`level-btn ${isSubjectSelected(subject.id, level) ? 'selected' : ''} ${selectedSubjectFromBlock && !isSubjectSelected(subject.id, level) ? 'disabled' : ''} ${level === 'HL' && selectedSubjects.filter(s => s.level === 'HL').length >= 4 && !isSubjectSelected(subject.id, level) ? 'hl-limit-reached' : ''}`}
                                style={{ '--subject-color': subject.color }}
                                onClick={() => toggleSubjectSelection(subject.id, level, block.name)}
                                disabled={selectedSubjectFromBlock && !isSubjectSelected(subject.id, level)}
                                title={level === 'HL' && selectedSubjects.filter(s => s.level === 'HL').length >= 4 && !isSubjectSelected(subject.id, level) ? "You can't pick more than 4 HLs" : ""}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Subjects Summary */}
            {selectedSubjects.length > 0 && (
              <div className="selected-subjects-summary">
                <h3>Your Selected Subjects ({selectedSubjects.length}/6)</h3>
                <div className="selected-subjects-grid">
                  {selectedSubjects.map((subject, index) => (
                    <div 
                      key={index} 
                      className="selected-subject-card"
                      style={{ '--subject-color': subject.color }}
                    >
                      <span className="selected-subject-name">{subject.name}</span>
                      <span className="selected-subject-level">{subject.level}</span>
                      <button 
                        className="remove-subject-btn"
                        onClick={() => toggleSubjectSelection(subject.id, subject.level, subjectBlocks.find(block => block.subjects.some(s => s.id === subject.id))?.name)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="selection-stats">
                  <span>HL: {selectedSubjects.filter(s => s.level === 'HL').length}/4</span>
                  <span>SL: {selectedSubjects.filter(s => s.level === 'SL').length}</span>
                  <span>Total: {selectedSubjects.length}/6</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Section */}
        {activeTab === 'notes' && (
          <div className="notes-section">
            {currentSubjectPage ? (
              // Individual Subject Page
              <div className="subject-page">
                <div className="subject-page-header">
                  <button className="back-btn" onClick={goBackToNotes}>
                    ← Back to Study Notes
                  </button>
                  <h2>{subjectBlocks.flatMap(block => block.subjects).find(s => s.id === currentSubjectPage)?.name} Notes</h2>
                  {isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
                    <div className="teacher-controls-subject">
                      {teacherSubjects.includes(currentSubjectPage) ? (
                        <>
                          <div className="teacher-badge">👨‍🏫 Teacher Access</div>
                          <button 
                            className="add-topic-btn"
                            onClick={() => setShowAddTopic(true)}
                          >
                            + Create Topic
                          </button>
                        </>
                      ) : (
                        <div className="teacher-badge view-only-badge">👁️ View Only</div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="subject-notes-content">
                  {contentLoading.subjectNotes ? (
                    <div className="loading-screen">
                      <div className="loading-spinner"></div>
                      <h3>Loading Notes...</h3>
                      <p>Fetching content for this subject</p>
                    </div>
                  ) : subjectNotes[currentSubjectPage] && subjectNotes[currentSubjectPage].length > 0 ? (
                    <div className="notes-grid">
                      {/* Filter notes based on user type and view mode */}
                      {(globalViewMode === 'student' ? 
                        // Student view: only show public notes
                        subjectNotes[currentSubjectPage].filter(note => note.isPublic === true) :
                        // Teacher/Admin view: show all notes
                        subjectNotes[currentSubjectPage]
                      ).map((note, index) => (
                        <div key={index} className="note-card">
                          <div className="note-header">
                            <div className="note-topic">{note.topic}</div>
                            {note.isPublic === false && (globalViewMode !== 'student') && (
                              <div className="private-badge">🔒 Private</div>
                            )}
                          </div>
                          <h3>{note.title}</h3>
                          {note.teacherName && (
                            <div className="note-teacher-info">
                              <span className="teacher-label">👨‍🏫 Created by:</span>
                              <span className="teacher-name">{note.teacherName}</span>
                            </div>
                          )}
                          <div className="note-content-preview">
                            {note.content && note.content.length > 150 ? (
                              <div dangerouslySetInnerHTML={{ 
                                __html: renderMarkdownContent(note.content.substring(0, 150) + '...') 
                              }} />
                            ) : (
                              <div dangerouslySetInnerHTML={{ 
                                __html: renderMarkdownContent(note.content) 
                              }} />
                            )}
                          </div>
                          <div className="note-actions">
                            <button 
                              className="view-document-btn"
                              onClick={() => openFullPageNote(note)}
                            >
                              📄 View Document
                            </button>
                            {isTeacher && teacherSubjects.includes(currentSubjectPage) && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
                              <>
                                                                  <button 
                                    className="edit-note-btn"
                                    onClick={() => startEditNote(note)}
                                    disabled={loadingStates['edit-note']}
                                  >
                                    {note.content && note.content.includes('Content for') && note.content.includes('will be added here') ? 'Add Content' : 'Edit Note'}
                                  </button>
                                <button 
                                  className={`toggle-public-btn ${note.isPublic ? 'make-private' : 'make-public'}`}
                                  onClick={() => toggleNotePublic(note.id, !note.isPublic)}
                                  title={note.isPublic ? 'Make Private' : 'Make Public'}
                                  disabled={loadingStates[`toggle-${note.id}`]}
                                >
                                  {loadingStates[`toggle-${note.id}`] ? (
                                    <div className="button-spinner small"></div>
                                  ) : successStates[`toggle-${note.id}`] ? (
                                    <>
                                      <div className="button-tick small">✓</div>
                                      Success!
                                    </>
                                  ) : (
                                    note.isPublic ? '🔒 Make Private' : '🌐 Make Public'
                                  )}
                                </button>
                                <button 
                                  className="delete-note-btn"
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={loadingStates[`delete-${note.id}`]}
                                >
                                  {loadingStates[`delete-${note.id}`] ? (
                                    <div className="button-spinner small"></div>
                                  ) : successStates[`delete-${note.id}`] ? (
                                    <>
                                      <div className="button-tick small">✓</div>
                                      Deleted!
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-notes">
                      <div className="no-notes-icon">📝</div>
                      <h3>No Notes Available</h3>
                      <p>There are no notes available for {subjectBlocks.flatMap(block => block.subjects).find(s => s.id === currentSubjectPage)?.name} yet.</p>
                      {isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
                        teacherSubjects.includes(currentSubjectPage) ? (
                          <p>Teachers can add content using the controls above.</p>
                        ) : (
                          <p>You can view content created by other teachers, but cannot add new content to this subject.</p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h2>Study Notes</h2>
                {selectedSubjects.length === 0 ? (
                  <div className="no-subjects-selected">
                    <div className="no-subjects-icon">📚</div>
                    <h3>No Subjects Selected</h3>
                    <p>Please go to "My Subjects" and select your IB subjects first.</p>
                    <button 
                      className="select-subjects-btn"
                      onClick={() => setActiveTab('subjects')}
                    >
                      Select Subjects
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="subject-selector-notes">
                      <label htmlFor="subject-select">Choose a subject to study:</label>
                      <select 
                        id="subject-select"
                        value={selectedSubject || ''}
                        onChange={(e) => {
                          const newSubject = e.target.value
                          setSelectedSubject(newSubject)
                          if (newSubject && !subjectNotes[newSubject]) {
                            loadNotesForSubject(newSubject)
                          }
                        }}
                      >
                        <option value="">Select a subject...</option>
                        {selectedSubjects.map((subject) => (
                          <option key={`${subject.id}-${subject.level}`} value={subject.id}>
                            {subject.name} ({subject.level})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="notes-grid">
                      {selectedSubject && subjectNotes[selectedSubject] ? (
                        // Additional safety filter: only show public notes to students
                        subjectNotes[selectedSubject]
                          .filter(note => note.isPublic === true) // Double-check privacy
                          .map((note, index) => (
                            <div key={index} className="note-card">
                              <div className="note-header">
                                <div className="note-topic">{note.topic}</div>
                                {/* Private badge should never show for students since we filtered them out */}
                              </div>
                              <h3>{note.title}</h3>
                              {note.teacherName && (
                                <div className="note-teacher-info">
                                  <span className="teacher-label">👨‍🏫 Created by:</span>
                                  <span className="teacher-name">{note.teacherName}</span>
                                </div>
                              )}
                              <div className="note-content-preview">
                                {note.content && note.content.length > 150 ? (
                                  <div dangerouslySetInnerHTML={{ 
                                    __html: renderMarkdownContent(note.content.substring(0, 150) + '...') 
                                  }} />
                                ) : (
                                  <div dangerouslySetInnerHTML={{ 
                                    __html: renderMarkdownContent(note.content) 
                                  }} />
                                )}
                              </div>
                              <button 
                                className="view-document-btn"
                                onClick={() => openFullPageNote(note)}
                              >
                                📄 View Document
                              </button>
                            </div>
                          ))
                      ) : selectedSubject ? (
                        <div className="no-notes">
                          <div className="no-notes-icon">📝</div>
                          <h3>No Notes Available</h3>
                          <p>There are no notes available for {selectedSubjects.find(s => s.id === selectedSubject)?.name} yet.</p>
                          <p>Check back later or contact your teacher for content.</p>
                        </div>
                      ) : (
                        <div className="no-subjects-selected">
                          <div className="no-subjects-icon">📚</div>
                          <h3>No Subject Selected</h3>
                          <p>Please select a subject from the dropdown above to view notes.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Questions Section */}
        {activeTab === 'ai' && (
          <div className="ai-section">
            <h2>🤖 Questions & Quizzes</h2>
            
            {/* Teacher View */}
            {isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && !showCreateQuiz && (
              <div className="teacher-quiz-controls">
                <button 
                  className="create-quiz-btn"
                  onClick={() => setShowCreateQuiz(true)}
                >
                  + Create New Quiz
                </button>
                <button 
                  className="view-quizzes-btn"
                  onClick={() => setShowCreateQuiz(false)}
                >
                  📋 View All Quizzes
                </button>
                {isAdmin && (
                  <button 
                    className="ai-config-btn"
                    onClick={() => setShowAIConfig(true)}
                  >
                    🤖 AI Configuration
                  </button>
                )}
                <button 
                  className="view-submissions-btn"
                  onClick={loadStudentSubmissions}
                >
                  📊 View Submissions
                </button>
              </div>
            )}

            {/* Student View */}
            {(!isTeacher || globalViewMode === 'student') && (
              <div className="student-quiz-join">
                {isTeacher && globalViewMode === 'student' && (
                  <div className="view-mode-notice">
                    <span className="notice-icon">👁️</span>
                    <span>You're currently viewing this as a student would see it</span>
                  </div>
                )}
                
                {/* Student Quiz Tabs */}
                <div className="student-quiz-tabs">
                  <button 
                    className={`quiz-tab ${!showStudentQuiz ? 'active' : ''}`}
                    onClick={() => setShowStudentQuiz(false)}
                  >
                    🎯 Join Quiz
                  </button>
                  <button 
                    className={`quiz-tab ${showStudentQuiz ? 'active' : ''}`}
                    onClick={() => setShowStudentQuiz(true)}
                  >
                    📊 View Results
                  </button>
                </div>

                {!showStudentQuiz ? (
                  <>
                    <div className="quiz-join-header">
                      <h3>🎯 Join a Quiz</h3>
                      <p className="quiz-join-subtitle">Enter the access code provided by your teacher to start a quiz</p>
                    </div>
                    
                    <div className="quiz-code-input-container">
                      <div className="quiz-code-input">
                        <div className="code-input-wrapper">
                          <label htmlFor="student-quiz-code" className="code-input-label">Quiz Access Code:</label>
                          <input
                            id="student-quiz-code"
                            type="text"
                            placeholder="Enter 6-character code (e.g., ABC123)"
                            value={studentQuizCode}
                            onChange={(e) => setStudentQuizCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="quiz-code-field"
                            autoComplete="off"
                            spellCheck="false"
                          />
                          <div className="code-input-hint">
                            <span className="hint-text">6 characters</span>
                            <span className="hint-text">Letters & numbers</span>
                          </div>
                        </div>
                        <button 
                          className={`join-quiz-btn ${buttonLoadingStates['join-quiz'] ? 'button-loading' : ''} ${buttonSuccessStates['join-quiz'] ? 'button-success' : ''}`}
                          onClick={() => handleButtonClick('join-quiz', joinQuizWithCode)}
                          disabled={!studentQuizCode.trim() || studentQuizCode.length < 6 || buttonLoadingStates['join-quiz']}
                        >
                          {buttonLoadingStates['join-quiz'] ? (
                            <>
                              <div className="button-spinner"></div>
                              Joining...
                            </>
                          ) : buttonSuccessStates['join-quiz'] ? (
                            '✅ Joined!'
                          ) : studentQuizCode.trim() && studentQuizCode.length < 6 ? (
                            'Complete Code'
                          ) : (
                            '🚀 Start Quiz'
                          )}
                        </button>
                      </div>
                      
                      <div className="quiz-join-info">
                        <div className="info-card">
                          <div className="info-icon">📚</div>
                          <h4>How it works</h4>
                          <ol>
                            <li>Get the quiz code from your teacher</li>
                            <li>Enter the 6-character code above</li>
                            <li>Answer the questions when ready</li>
                            <li>Submit for teacher review</li>
                          </ol>
                        </div>
                        
                        <div className="info-card">
                          <div className="info-icon">📝</div>
                          <h4>Quiz Process</h4>
                          <ul>
                            <li>Answer all questions carefully</li>
                            <li>Submit when you're finished</li>
                            <li>Wait for teacher marking</li>
                            <li>View detailed feedback</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {studentQuizCode && studentQuizCode.length < 6 && (
                      <div className="code-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(studentQuizCode.length / 6) * 100}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{studentQuizCode.length}/6 characters</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="student-results-view">
                    <div className="results-header">
                      <h3>📊 Your Quiz Results</h3>
                      <p>View your submitted quizzes and results</p>
                    </div>
                    
                    {studentSubmissions.length === 0 ? (
                      <div className="no-results">
                        <p>You haven't taken any quizzes yet.</p>
                        <p>Join a quiz using the "Join Quiz" tab above.</p>
                      </div>
                    ) : (
                      <div className="student-submissions-list">
                        {studentSubmissions
                          .filter(sub => sub.studentId === user?.uid)
                          .map((submission) => {
                            const quiz = allQuizzes.find(q => q.id === submission.quizId)
                            const question = quiz?.questions.find(q => q.id === submission.questionId)
                            
                            return (
                              <div key={submission.id} className="student-submission-item">
                                <div className="submission-header">
                                  <h4>{quiz?.title || 'Unknown Quiz'}</h4>
                                  <span className={`status-badge ${submission.marked ? 'marked' : 'pending'}`}>
                                    {submission.marked ? '✅ Marked' : '⏳ Pending'}
                                  </span>
                                </div>
                                
                                <div className="submission-details">
                                  <p><strong>Question:</strong> {question?.question || 'Question not found'}</p>
                                  <p><strong>Your Answer:</strong> {submission.answer}</p>
                                  <p><strong>Submitted:</strong> {submission.submittedAt?.toDate?.() ? new Date(submission.submittedAt.toDate()).toLocaleString() : 'Unknown'}</p>
                                </div>
                                
                                {submission.marked && (
                                  <div className="submission-results">
                                    <div className="score-display">
                                      <span className="score">{submission.score}</span>
                                      <span className="max-score">/ {question?.marks || 0}</span>
                                    </div>
                                    <div className="feedback-section">
                                      <p><strong>Feedback:</strong> {submission.feedback}</p>
                                      {submission.suggestions && (
                                        <p><strong>Suggestions:</strong> {submission.suggestions}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quiz Creation Interface */}
            {showCreateQuiz && isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
              <div className="quiz-creation-interface">
                <h3>Create New Quiz</h3>
                
                <div className="quiz-form">
                  <div className="form-group">
                    <label htmlFor="quiz-title">Quiz Title:</label>
                    <input
                      type="text"
                      id="quiz-title"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter quiz title (e.g., Topic 1: Cell Biology Quiz)"
                      className="quiz-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="quiz-subject">Subject:</label>
                    <select
                      id="quiz-subject"
                      value={quizSubject}
                      onChange={(e) => setQuizSubject(e.target.value)}
                      className="quiz-select"
                    >
                      <option value="">Select a subject...</option>
                      {subjectBlocks.flatMap(block => block.subjects).map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="questions-section">
                    <h4>Add Questions</h4>
                    <div className="question-form">
                      <div className="form-group">
                        <label htmlFor="current-question">Question:</label>
                        <textarea
                          id="current-question"
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          placeholder="Enter your question here..."
                          rows="3"
                          className="question-textarea"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="current-answer">Expected Answer:</label>
                        <textarea
                          id="current-answer"
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          placeholder="Enter the expected answer for AI marking..."
                          rows="3"
                          className="answer-textarea"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="current-marks">Marks:</label>
                        <input
                          type="number"
                          id="current-marks"
                          value={currentMarks}
                          onChange={(e) => setCurrentMarks(parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          className="marks-input"
                        />
                      </div>
                      
                      <button 
                        className={`add-question-btn ${buttonLoadingStates['add-question'] ? 'button-loading' : ''} ${buttonSuccessStates['add-question'] ? 'button-success' : ''}`}
                        onClick={() => handleButtonClick('add-question', addQuestionToQuiz)}
                        disabled={!currentQuestion.trim() || !currentAnswer.trim() || buttonLoadingStates['add-question']}
                      >
                        {buttonLoadingStates['add-question'] ? (
                          <>
                            <div className="button-spinner"></div>
                            Adding...
                          </>
                        ) : buttonSuccessStates['add-question'] ? (
                          '✅ Added!'
                        ) : (
                          '+ Add Question'
                        )}
                      </button>
                    </div>
                    
                    {/* Questions List */}
                    {quizQuestions.length > 0 && (
                      <div className="questions-list">
                        <h4>Quiz Questions ({quizQuestions.length})</h4>
                        {quizQuestions.map((q, index) => (
                          <div key={q.id} className="question-item">
                            <div className="question-header">
                              <span className="question-number">Q{index + 1}</span>
                              <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                              <button 
                                className="remove-question-btn"
                                onClick={() => removeQuestionFromQuiz(q.id)}
                                title="Remove question"
                              >
                                ×
                              </button>
                            </div>
                            <p className="question-text">{q.question}</p>
                            <p className="answer-text"><strong>Expected:</strong> {q.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button 
                      className={`create-quiz-final-btn ${buttonLoadingStates['create-quiz'] ? 'button-loading' : ''} ${buttonSuccessStates['create-quiz'] ? 'button-success' : ''}`}
                      onClick={() => handleButtonClick('create-quiz', createQuiz)}
                      disabled={!quizTitle.trim() || !quizSubject || quizQuestions.length === 0 || buttonLoadingStates['create-quiz']}
                    >
                      {buttonLoadingStates['create-quiz'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Creating...
                        </>
                      ) : buttonSuccessStates['create-quiz'] ? (
                        '✅ Created!'
                      ) : (
                        '🚀 Create Quiz & Generate Code'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Code Display */}
            {showQuizCode && (
              <div className="quiz-code-display">
                <div className="success-header">
                  <div className="success-icon">🎉</div>
                  <h3>Quiz Created Successfully!</h3>
                  <p className="success-subtitle">Your quiz is ready! Share the access code below with your students.</p>
                </div>
                
                <div className="quiz-code-section">
                  <div className="code-display-header">
                    <h4>📋 Quiz Access Code</h4>
                    <p>Students need this code to join your quiz</p>
                  </div>
                  
                  <div className="quiz-code">
                    <span className="code-text">{quizCode}</span>
                    <button 
                      className={`copy-code-btn ${buttonLoadingStates['copy-code'] ? 'button-loading' : ''} ${buttonSuccessStates['copy-code'] ? 'button-success' : ''}`}
                      onClick={() => handleButtonClick('copy-code', async () => {
                        await navigator.clipboard.writeText(quizCode)
                        showAlert('✅ Access code copied to clipboard!', 'success')
                      })}
                      title="Copy access code"
                      disabled={buttonLoadingStates['copy-code']}
                    >
                      {buttonLoadingStates['copy-code'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Copying...
                        </>
                      ) : buttonSuccessStates['copy-code'] ? (
                        '✅ Copied!'
                      ) : (
                        '📋 Copy Code'
                      )}
                    </button>
                  </div>
                  
                  <div className="code-sharing-options">
                    <div className="sharing-option">
                      <span className="option-icon">💬</span>
                      <span>Share in chat/message</span>
                    </div>
                    <div className="sharing-option">
                      <span className="option-icon">📧</span>
                      <span>Send via email</span>
                    </div>
                    <div className="sharing-option">
                      <span className="option-icon">📱</span>
                      <span>Display on screen</span>
                    </div>
                  </div>
                </div>
                
                <div className="student-instructions">
                  <h4>📚 Student Instructions</h4>
                  <div className="instruction-steps">
                    <div className="instruction-step">
                      <span className="step-number">1</span>
                      <span>Go to "Questions" tab</span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">2</span>
                      <span>Enter the access code: <strong>{quizCode}</strong></span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">3</span>
                      <span>Click "Start Quiz"</span>
                    </div>
                    <div className="instruction-step">
                      <span className="step-number">4</span>
                      <span>Answer questions and submit</span>
                    </div>
                  </div>
                </div>
                
                <div className="quiz-code-actions">
                  <button 
                    className="create-another-btn"
                    onClick={() => {
                      setShowQuizCode(false)
                      setShowCreateQuiz(true)
                    }}
                  >
                    ➕ Create Another Quiz
                  </button>
                  <button 
                    className="close-quiz-code-btn"
                    onClick={() => setShowQuizCode(false)}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            )}

            {/* View All Quizzes */}
            {!showCreateQuiz && isTeacher && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
              <div className="all-quizzes-view">
                <h3>All Quizzes</h3>
                {allQuizzes.length > 0 ? (
                  <div className="quizzes-grid">
                    {allQuizzes.map((quiz) => (
                      <div key={quiz.id} className="quiz-card">
                        <div className="quiz-header">
                          <h4>{quiz.title}</h4>
                          <span className="quiz-code-badge">{quiz.code}</span>
                        </div>
                        <div className="quiz-details">
                          <p><strong>Subject:</strong> {subjectBlocks.flatMap(block => block.subjects).find(s => s.id === quiz.subject)?.name || quiz.subject}</p>
                          <p><strong>Questions:</strong> {quiz.questions.length}</p>
                          <p><strong>Total Marks:</strong> {quiz.questions.reduce((sum, q) => sum + q.marks, 0)}</p>
                          <p><strong>Created:</strong> {quiz.createdAt?.toDate?.() ? new Date(quiz.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</p>
                          <p><strong>Created by:</strong> {quiz.teacherName || 'Unknown Teacher'}</p>
                        </div>
                        <div className="quiz-actions">
                          <button 
                            className="view-quiz-btn"
                            onClick={() => {
                              setCurrentQuiz(quiz)
                              setShowStudentQuiz(true)
                            }}
                          >
                            👁️ Preview Quiz
                          </button>
                          {quiz.createdBy === user.uid && (
                            <>
                              <button 
                                className="view-submissions-btn"
                                onClick={() => {
                                  console.log('Quiz ID being passed:', quiz.id)
                                  console.log('Quiz object:', quiz)
                                  viewQuizSubmissions(quiz.id)
                                }}
                                disabled={isLoadingViewSubmissions}
                                title="View student submissions for this quiz"
                              >
                                {isLoadingViewSubmissions ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    Loading...
                                  </>
                                ) : (
                                  '📊 View Submissions'
                                )}
                              </button>
                              <button 
                                className={`delete-quiz-btn ${buttonLoadingStates[`delete-quiz-${quiz.id}`] ? 'button-loading' : ''} ${buttonSuccessStates[`delete-quiz-${quiz.id}`] ? 'button-success' : ''}`}
                                onClick={() => handleButtonClick(`delete-quiz-${quiz.id}`, () => deleteQuiz(quiz.id))}
                                title="Delete this quiz"
                                disabled={buttonLoadingStates[`delete-quiz-${quiz.id}`]}
                              >
                                {buttonLoadingStates[`delete-quiz-${quiz.id}`] ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    Deleting...
                                  </>
                                ) : buttonSuccessStates[`delete-quiz-${quiz.id}`] ? (
                                  '✅ Deleted!'
                                ) : (
                                  '🗑️ Delete Quiz'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-quizzes">
                    <p>No quizzes created yet. Create your first quiz!</p>
                  </div>
                )}
              </div>
            )}

            {/* Student Subject Selection Interface */}
            {!isTeacher && (
              <div className="student-subject-selection-section">
                {!showSubjectSelection ? (
                  <div className="subject-selection-prompt">
                    <h3>📚 IB Subject Selection</h3>
                    <p>Select your IB subjects to get started with quizzes and study materials. You need 6 subjects total: 3-4 HL and 2-3 SL.</p>
                    <button 
                      className="open-subject-selection-btn"
                      onClick={() => setShowSubjectSelection(true)}
                    >
                      🎯 Choose Subjects
                    </button>
                  </div>
                ) : (
                  <div className="student-subject-selection">
                    <div className="selection-header">
                      <h3>📚 Select Your IB Subjects</h3>
                                          <p className="selection-instructions">
                      Choose your subjects for the IB Diploma Programme. You need 6 subjects total: 
                      3-4 HL (Higher Level) and 2-3 SL (Standard Level) subjects.
                    </p>
                    </div>

                    <div className="subject-selection-grid">
                      {subjectBlocks.flatMap(block => block.subjects).map((subject) => {
                        const isSelected = studentSelectedSubjects.find(sub => sub.subjectId === subject.id)
                        const isHL = isSelected?.isHL || false
                        
                        return (
                          <div key={subject.id} className={`subject-selection-card ${isSelected ? (isHL ? 'hl-selected' : 'sl-selected') : ''}`}>
                            <h4>{subject.name}</h4>
                            <p className="subject-description">{subject.description || 'IB Subject'}</p>
                            
                            <div className="subject-level-buttons">
                                                        <button
                            className={`level-btn sl-btn ${isSelected && !isHL ? 'active' : ''}`}
                            onClick={() => handleStudentSubjectSelection(subject.id, false)}
                            disabled={!getSubjectSelectionStatus().canAddSL && !isSelected}
                          >
                            SL
                          </button>
                          <button
                            className={`level-btn hl-btn ${isSelected && isHL ? 'active' : ''}`}
                            onClick={() => handleStudentSubjectSelection(subject.id, true)}
                            disabled={!getSubjectSelectionStatus().canAddHL && !isSelected}
                          >
                            HL
                          </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="selection-summary">
                      <div className="summary-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total Subjects:</span>
                          <span className="stat-value">{getSubjectSelectionStatus().totalCount}/6</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">HL Subjects:</span>
                          <span className="stat-value">{getSubjectSelectionStatus().hlCount}/4</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">SL Subjects:</span>
                          <span className="stat-value">{getSubjectSelectionStatus().slCount}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">IB Requirements:</span>
                          <span className={`stat-value ${getSubjectSelectionStatus().meetsMinimum ? 'met' : 'not-met'}`}>
                            {getSubjectSelectionStatus().meetsMinimum ? '✓ Met' : '✗ Not Met'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="selection-actions">
                        <button 
                          className={`save-selection-btn ${buttonLoadingStates['save-selection'] ? 'button-loading' : ''} ${buttonSuccessStates['save-selection'] ? 'button-success' : ''}`}
                          onClick={() => handleButtonClick('save-selection', saveStudentSubjectSelection)}
                          disabled={!getSubjectSelectionStatus().meetsMinimum || buttonLoadingStates['save-selection']}
                        >
                          {buttonLoadingStates['save-selection'] ? (
                            <>
                              <div className="button-spinner"></div>
                              Saving...
                            </>
                          ) : buttonSuccessStates['save-selection'] ? (
                            '✅ Saved!'
                          ) : (
                            '💾 Save Selection'
                          )}
                        </button>
                        <button 
                          className="cancel-selection-btn"
                          onClick={() => setShowSubjectSelection(false)}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student Quiz Interface */}
            {showStudentQuiz && currentQuiz && (
              <div className="student-quiz-interface">
                <div className="quiz-header">
                  <h3>{currentQuiz.title}</h3>
                  <p className="quiz-subject">Subject: {subjectBlocks.flatMap(block => block.subjects).find(s => s.id === currentQuiz.subject)?.name || currentQuiz.subject}</p>
                  <p className="quiz-instructions">Answer the questions below. Your answers will be submitted for teacher review.</p>
                </div>
                
                {!quizResults ? (
                  <div className="quiz-questions">
                    {currentQuiz.questions.map((q, index) => (
                      <div key={q.id} className="quiz-question">
                        <div className="question-header">
                          <span className="question-number">Question {index + 1}</span>
                          <span className="question-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="question-text">{q.question}</p>
                        <textarea
                          placeholder="Enter your answer here..."
                          value={studentAnswers[q.id] || ''}
                          onChange={(e) => setStudentAnswers({
                            ...studentAnswers,
                            [q.id]: e.target.value
                          })}
                          rows="4"
                          className="student-answer-input"
                        />
                      </div>
                    ))}
                    
                    <div className="quiz-submit">
                      <button 
                        className={`submit-quiz-btn ${buttonLoadingStates['quiz-submit'] ? 'button-loading' : ''} ${buttonSuccessStates['quiz-submit'] ? 'button-success' : ''}`}
                        onClick={() => handleButtonClick('quiz-submit', submitQuiz)}
                        disabled={Object.keys(studentAnswers).length === 0 || buttonLoadingStates['quiz-submit']}
                      >
                        {buttonLoadingStates['quiz-submit'] ? (
                          <>
                            <div className="button-spinner"></div>
                            Submitting...
                          </>
                        ) : buttonSuccessStates['quiz-submit'] ? (
                          '✅ Submitted!'
                        ) : (
                          '📝 Submit Quiz'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="quiz-results">
                    <h3>🎯 Quiz Results</h3>
                    <div className="results-summary">
                      <div className="score-display">
                        <span className="score">{quizResults.totalMarks}</span>
                        <span className="max-score">/ {quizResults.maxMarks}</span>
                        <span className="percentage">({quizResults.percentage}%)</span>
                      </div>
                    </div>
                    
                    <div className="detailed-results">
                      {quizResults.results.map((result, index) => (
                        <div key={index} className="result-item">
                          <div className="result-header">
                            <span className="result-question">Q{index + 1}</span>
                            <span className="result-score">{result.score}/{result.marks}</span>
                          </div>
                          <p className="result-question-text">{result.question}</p>
                          <p className="result-student-answer"><strong>Your Answer:</strong> {result.studentAnswer}</p>
                          <p className="result-feedback">{result.feedback}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="quiz-results-actions">
                      <button 
                        className="reset-quiz-btn"
                        onClick={resetQuiz}
                      >
                        🔄 Take Another Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Configuration Modal */}
            {showAIConfig && (
              <div className="modal-overlay">
                <div className="modal ai-config-modal">
                  <div className="modal-header">
                    <h3>🤖 AI Configuration</h3>
                    <button className="close-modal-btn" onClick={() => setShowAIConfig(false)}>
                      ×
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    {!isAdmin ? (
                      <div className="ai-config-section">
                        <h4>🔒 Access Restricted</h4>
                        <p className="config-description">
                          AI Configuration is only available to administrators. 
                          Teachers can use AI marking if an API key has been configured by an admin.
                        </p>
                        <div className="ai-config-info">
                          <p><strong>Current Status:</strong></p>
                          <ul>
                            <li>API Key: {openAIKey ? '✅ Configured' : '❌ Not Configured'}</li>
                            <li>AI Marking: {useAIMarking ? '✅ Enabled' : '❌ Disabled'}</li>
                          </ul>
                          <p className="note">
                            <em>Note: Contact an administrator to configure AI marking for your account.</em>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ai-config-section">
                          <h4>🔑 OpenAI API Configuration</h4>
                          <p className="config-description">
                            Configure your OpenAI API key to enable AI-powered quiz marking. 
                            Your API key is stored securely and only used for quiz marking.
                          </p>
                      
                      <div className="form-group">
                        <label htmlFor="openai-key">OpenAI API Key:</label>
                        <input
                          type="password"
                          id="openai-key"
                          value={openAIKey}
                          onChange={(e) => setOpenAIKey(e.target.value)}
                          placeholder="sk-..."
                          className="api-key-input"
                        />
                        <div className="api-key-actions">
                          <button 
                            className={`test-api-btn ${buttonLoadingStates['test-connection'] ? 'button-loading' : ''} ${buttonSuccessStates['test-connection'] ? 'button-success' : ''}`}
                            onClick={() => handleButtonClick('test-connection', testOpenAIConnection)}
                            disabled={!openAIKey.trim() || buttonLoadingStates['test-connection']}
                          >
                            {buttonLoadingStates['test-connection'] ? (
                              <>
                                <div className="button-spinner"></div>
                                Testing...
                              </>
                            ) : buttonSuccessStates['test-connection'] ? (
                              '✅ Connected!'
                            ) : (
                              '🧪 Test Connection'
                            )}
                          </button>
                          <button 
                            className="clear-api-btn"
                            onClick={() => setOpenAIKey('')}
                          >
                            🗑️ Clear
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ai-config-section">
                      <h4>🎯 AI Marking Options</h4>
                      
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={useAIMarking}
                            onChange={(e) => setUseAIMarking(e.target.checked)}
                          />
                          <span className="checkmark"></span>
                          Enable AI-powered quiz marking
                        </label>
                      </div>
                      
                      {useAIMarking && (
                        <div className="form-group">
                          <label htmlFor="ai-prompt">Custom Marking Instructions:</label>
                          <textarea
                            id="ai-prompt"
                            value={aiMarkingPrompt}
                            onChange={(e) => setAiMarkingPrompt(e.target.value)}
                            placeholder="Enter custom instructions for AI marking (optional). For example: 'Be encouraging and provide specific improvement suggestions.'"
                            rows="4"
                            className="ai-prompt-textarea"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="ai-config-section">
                      <h4>💡 How AI Marking Works</h4>
                      <div className="ai-marking-info">
                        <div className="info-item">
                          <span className="info-icon">📝</span>
                          <div>
                            <strong>Student submits quiz</strong>
                            <p>Answers are sent to OpenAI for analysis</p>
                          </div>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🤖</span>
                          <div>
                            <strong>AI analyzes answers</strong>
                            <p>Compares with expected answers and provides feedback</p>
                          </div>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">📊</span>
                          <div>
                            <strong>Results returned</strong>
                            <p>Students get detailed scoring and improvement suggestions</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setShowAIConfig(false)}>
                    Cancel
                  </button>
                  {isAdmin && (
                    <button 
                      className={`confirm-btn ${buttonLoadingStates['save-ai-config'] ? 'button-loading' : ''} ${buttonSuccessStates['save-ai-config'] ? 'button-success' : ''}`}
                      onClick={() => handleButtonClick('save-ai-config', saveAIConfiguration)}
                      disabled={buttonLoadingStates['save-ai-config']}
                    >
                      {buttonLoadingStates['save-ai-config'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Saving...
                        </>
                      ) : buttonSuccessStates['save-ai-config'] ? (
                        '✅ Saved!'
                      ) : (
                        '💾 Save Configuration'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Student Submissions View */}
            {showStudentSubmissions && (
              <div className="student-submissions-view">
                <div className="submissions-header">
                  <h3>📊 Student Quiz Submissions</h3>
                  <div className="submissions-actions">
                    <button 
                      className={`mark-all-ai-btn ${buttonLoadingStates['mark-all-ai'] ? 'button-loading' : ''} ${buttonSuccessStates['mark-all-ai'] ? 'button-success' : ''}`}
                      onClick={() => handleButtonClick('mark-all-ai', markAllSubmissionsWithAI)}
                      disabled={!useAIMarking || !openAIKey.trim() || buttonLoadingStates['mark-all-ai']}
                      title={!useAIMarking || !openAIKey.trim() ? 'Enable AI marking and configure API key first' : 'Mark all unmarked submissions with AI'}
                    >
                      {buttonLoadingStates['mark-all-ai'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Marking...
                        </>
                      ) : buttonSuccessStates['mark-all-ai'] ? (
                        '✅ Marked!'
                      ) : (
                        '🤖 Mark All with AI'
                      )}
                    </button>
                    <button 
                      className="close-submissions-btn"
                      onClick={() => setShowStudentSubmissions(false)}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {studentSubmissions.length === 0 ? (
                  <div className="no-submissions">
                    <p>No student submissions found.</p>
                  </div>
                ) : (
                  <div className="students-list">
                    {/* Group submissions by student */}
                    {(() => {
                      const studentsMap = new Map()
                      
                      studentSubmissions.forEach(submission => {
                        const studentId = submission.studentId
                        if (!studentsMap.has(studentId)) {
                          studentsMap.set(studentId, {
                            studentId: studentId,
                            studentName: submission.studentName || 'Anonymous',
                            submissions: [],
                            totalScore: 0,
                            maxScore: 0,
                            markedCount: 0,
                            totalSubmissions: 0
                          })
                        }
                        
                        const student = studentsMap.get(studentId)
                        student.submissions.push(submission)
                        student.totalSubmissions++
                        
                        if (submission.marked) {
                          student.markedCount++
                          student.totalScore += submission.score || 0
                        }
                        
                        const quiz = allQuizzes.find(q => q.id === submission.quizId)
                        const question = quiz?.questions.find(q => q.id === submission.questionId)
                        student.maxScore += question?.marks || 0
                      })
                      
                      return Array.from(studentsMap.values()).map(student => (
                        <div key={student.studentId} className="student-card">
                          <div className="student-header">
                            <div className="student-info">
                              <h4>{student.studentName}</h4>
                              <p className="student-stats">
                                {student.markedCount}/{student.totalSubmissions} questions marked
                                {student.markedCount > 0 && (
                                  <span className="score-summary">
                                    • Score: {student.totalScore}/{student.maxScore}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="student-actions">
                              <button 
                                className="view-student-btn"
                                onClick={() => {
                                  console.log('Student ID being passed:', student.studentId)
                                  console.log('Student object:', student)
                                  console.log('Current studentSubmissions:', studentSubmissions)
                                  viewStudentSubmissions(student.studentId)
                                }}
                                disabled={isLoadingViewAnswers}
                              >
                                {isLoadingViewAnswers ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    Loading...
                                  </>
                                ) : (
                                  '👁️ View Answers'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Individual Student Submissions View */}
            {showIndividualStudent && selectedStudent && (
              <div className="individual-student-view">
                <div className="student-view-header">
                  <button 
                    className="back-to-students-btn"
                    onClick={() => {
                      setShowIndividualStudent(false)
                      setSelectedStudent(null)
                    }}
                  >
                    ← Back to Students
                  </button>
                  <h3>📝 {selectedStudent.studentName}'s Answers</h3>
                  <div className="student-summary">
                    <span className="student-score">
                      {selectedStudent.totalScore}/{selectedStudent.maxScore} marks
                    </span>
                    <span className="student-progress">
                      {selectedStudent.markedCount}/{selectedStudent.totalSubmissions} marked
                    </span>
                  </div>
                </div>

                <div className="student-submissions-list">
                  {selectedStudent.submissions.map((submission) => {
                    const quiz = allQuizzes.find(q => q.id === submission.quizId)
                    const question = quiz?.questions.find(q => q.id === submission.questionId)
                    
                    return (
                      <div key={submission.id} className="submission-card">
                        <div className="submission-header">
                          <div className="submission-info">
                            <h4>{quiz?.title || 'Unknown Quiz'}</h4>
                            <p className="question-text">{question?.question || 'Question not found'}</p>
                            <p className="submission-date">
                              Submitted: {submission.submittedAt?.toDate?.() ? new Date(submission.submittedAt.toDate()).toLocaleString() : 'Unknown'}
                            </p>
                          </div>
                          <div className="submission-status">
                            {submission.marked ? (
                              <span className={`status-badge ${submission.aiMarked ? 'ai-marked' : 'manually-marked'}`}>
                                {submission.aiMarked ? '🤖 AI Marked' : '✏️ Manually Marked'}
                              </span>
                            ) : (
                              <span className="status-badge unmarked">⏳ Unmarked</span>
                            )}
                          </div>
                        </div>

                        <div className="submission-content">
                          <div className="question-section">
                            <h5>Question Details:</h5>
                            <p className="expected-answer">
                              <strong>Expected Answer:</strong> {question?.answer || 'Not provided'}
                            </p>
                            <p className="max-marks">
                              <strong>Max Marks:</strong> {question?.marks || 0}
                            </p>
                          </div>
                          
                          <div className="answer-section">
                            <h5>Student Answer:</h5>
                            <p className="student-answer">{submission.answer || 'No answer provided'}</p>
                          </div>

                          {submission.marked ? (
                            <div className="marking-results">
                              <h5>Marking Results:</h5>
                              <div className="score-display">
                                <span className="score">{submission.score}</span>
                                <span className="max-score">/ {question?.marks || 0}</span>
                              </div>
                              <div className="feedback-section">
                                <p><strong>Feedback:</strong> {submission.feedback}</p>
                                {submission.suggestions && (
                                  <p><strong>Suggestions:</strong> {submission.suggestions}</p>
                                )}
                              </div>
                              <p className="marked-by">
                                Marked by: {submission.markedBy === user.uid ? 'You' : 'Another teacher'} 
                                {submission.markedAt && ` on ${new Date(submission.markedAt.toDate()).toLocaleString()}`}
                              </p>
                            </div>
                          ) : (
                            <div className="marking-actions">
                              <button 
                                className="mark-with-ai-btn"
                                onClick={async () => {
                                  const result = await markSubmissionWithAI(submission)
                                  if (result) {
                                    // Update submission immediately in local state
                                    setStudentSubmissions(prev => prev.map(sub => 
                                      sub.id === submission.id 
                                        ? { ...sub, ...result, marked: true, aiMarked: true, markedAt: new Date(), markedBy: user.uid }
                                        : sub
                                    ))
                                    
                                    // Also update in database
                                    try {
                                      await updateDoc(doc(db, 'quizSubmissions', submission.id), {
                                        marked: true,
                                        aiMarked: true,
                                        score: result.score,
                                        feedback: result.feedback,
                                        suggestions: result.suggestions,
                                        markedAt: new Date(),
                                        markedBy: user.uid
                                      })
                                      
                                      // Refresh the selected student data
                                      refreshSelectedStudentData()
                                    } catch (error) {
                                      console.error('Error updating submission in database:', error)
                                      alert('Error saving to database. Please try again.')
                                    }
                                  }
                                }}
                                disabled={!isAdmin && (!useAIMarking || !openAIKey.trim()) || isLoadingAIMarking[submission.id]}
                                title={!isAdmin && (!useAIMarking || !openAIKey.trim()) ? 'AI marking is only available to admins or teachers with pre-configured API keys' : 'Mark this submission with AI'}
                              >
                                {isLoadingAIMarking[submission.id] ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    Marking...
                                  </>
                                ) : (
                                  '🤖 Mark with AI'
                                )}
                              </button>
                              <button 
                                className="manual-mark-btn"
                                onClick={() => {
                                  setSelectedSubmission(submission)
                                  setManualMarking(prev => ({
                                    ...prev,
                                    [submission.id]: {
                                      score: 0,
                                      feedback: '',
                                      suggestions: ''
                                    }
                                  }))
                                  setShowManualMarking(true)
                                }}
                                disabled={isLoadingManualMarking[submission.id]}
                              >
                                {isLoadingManualMarking[submission.id] ? (
                                  <>
                                    <div className="button-spinner"></div>
                                    Loading...
                                  </>
                                ) : (
                                  '✏️ Mark Manually'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Manual Marking Modal */}
            {showManualMarking && selectedSubmission && (
              <div className="modal-overlay">
                <div className="modal manual-marking-modal">
                  <div className="modal-header">
                    <h3>✏️ Manual Marking</h3>
                    <button className="close-modal-btn" onClick={() => setShowManualMarking(false)}>
                      ×
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    <div className="submission-preview">
                      <h4>Submission Details</h4>
                      <p><strong>Quiz:</strong> {allQuizzes.find(q => q.id === selectedSubmission.quizId)?.title}</p>
                      <p><strong>Student:</strong> {selectedSubmission.studentName || 'Anonymous'}</p>
                      <p><strong>Question:</strong> {allQuizzes.find(q => q.id === selectedSubmission.quizId)?.questions.find(q => q.id === selectedSubmission.questionId)?.question}</p>
                      <p><strong>Student Answer:</strong> {selectedSubmission.answer}</p>
                      <p><strong>Max Marks:</strong> {allQuizzes.find(q => q.id === selectedSubmission.quizId)?.questions.find(q => q.id === selectedSubmission.questionId)?.marks}</p>
                    </div>
                    
                    <div className="marking-form">
                      <div className="form-group">
                        <label htmlFor="manual-score">Score:</label>
                        <input
                          type="number"
                          id="manual-score"
                          min="0"
                          max={allQuizzes.find(q => q.id === selectedSubmission.quizId)?.questions.find(q => q.id === selectedSubmission.questionId)?.marks || 0}
                          value={manualMarking[selectedSubmission.id]?.score || 0}
                          onChange={(e) => setManualMarking(prev => ({
                            ...prev,
                            [selectedSubmission.id]: {
                              ...prev[selectedSubmission.id],
                              score: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="score-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="manual-feedback">Feedback:</label>
                        <textarea
                          id="manual-feedback"
                          value={manualMarking[selectedSubmission.id]?.feedback || ''}
                          onChange={(e) => setManualMarking(prev => ({
                            ...prev,
                            [selectedSubmission.id]: {
                              ...prev[selectedSubmission.id],
                              feedback: e.target.value
                            }
                          }))}
                          placeholder="Provide detailed feedback on the student's answer..."
                          rows="4"
                          className="feedback-textarea"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="manual-suggestions">Suggestions for Improvement:</label>
                        <textarea
                          id="manual-suggestions"
                          value={manualMarking[selectedSubmission.id]?.suggestions || ''}
                          onChange={(e) => setManualMarking(prev => ({
                            ...prev,
                            [selectedSubmission.id]: {
                              ...prev[selectedSubmission.id],
                              suggestions: e.target.value
                            }
                          }))}
                          placeholder="Suggest ways the student can improve their answer..."
                          rows="3"
                          className="suggestions-textarea"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowManualMarking(false)}>
                      Cancel
                    </button>
                    <button 
                      className={`confirm-btn ${buttonLoadingStates['save-marking'] ? 'button-loading' : ''} ${buttonSuccessStates['save-marking'] ? 'button-success' : ''}`}
                      onClick={async () => {
                        await handleButtonClick('save-marking', async () => {
                          await saveManualMarking(selectedSubmission.id)
                          setShowManualMarking(false)
                          setSelectedSubmission(null)
                          // Refresh the selected student data if we're in individual view
                          if (showIndividualStudent && selectedStudent) {
                            refreshSelectedStudentData()
                          }
                        })
                      }}
                      disabled={buttonLoadingStates['save-marking']}
                    >
                      {buttonLoadingStates['save-marking'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Saving...
                        </>
                      ) : buttonSuccessStates['save-marking'] ? (
                        '✅ Saved!'
                      ) : (
                        '💾 Save Marking'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teacher Panel */}
        {activeTab === 'teacher' && isTeacher && (
          <div className="teacher-section">
            <h2>👨‍🏫 Teacher Control Panel</h2>
            <p className="teacher-subtitle">Welcome, {user?.displayName || user?.email}</p>
            
            {/* Global View Mode Info */}
            <div className="view-mode-info">
              <h3>Current View: {
                globalViewMode === 'normal' ? '🌐 Normal Mode (Admin)' :
                globalViewMode === 'teacher' ? '👨‍🏫 Teacher Mode' : 
                '👨‍🎓 Student Mode'
              }</h3>
              <p>Switch view mode using the toggle in the bottom left to see different perspectives of the website.</p>
              {globalViewMode === 'normal' && (
                <p className="admin-note">🌐 Normal Mode: Full system access for admin management</p>
              )}
            </div>
            
            {contentLoading.teacherPanel ? (
              <div className="loading-screen">
                <div className="loading-spinner"></div>
                <h3>Loading Your Teaching Content...</h3>
                <p>Fetching notes and subjects from the database</p>
              </div>
            ) : (
              <>
                <div className="teacher-stats">
                  <div className="stat-card">
                    <h3>Your Subjects</h3>
                    <span className="stat-number">{teacherSubjects.length}</span>
                  </div>
                  <div className="stat-card">
                    <h3>Total Notes</h3>
                    <span className="stat-number">
                      {Object.values(subjectNotes).flat().length}
                    </span>
                  </div>
                </div>

            <div className="teacher-subjects-overview">
              <h3>{globalViewMode === 'student' ? 'Subjects Available for Study' : 'Available Subjects with Content'}</h3>
              {globalViewMode !== 'student' && (
                <p className="teacher-subjects-explanation">
                  <span className="assigned-indicator">✅ Assigned</span> - You can add and manage content for these subjects<br/>
                  <span className="available-indicator">🔓 Available</span> - You can view content created by other teachers
                </p>
              )}
              <div className="teacher-subjects-grid">
                {subjectBlocks.flatMap(block => block.subjects).map((subject) => {
                  const hasContent = subjectNotes[subject.id] && subjectNotes[subject.id].length > 0
                  const isAssigned = teacherSubjects.includes(subject.id)
                  const notes = subjectNotes[subject.id] || []
                  const publicNotes = globalViewMode === 'student' ? notes.filter(note => note.isPublic === true) : notes
                  
                  return (
                    <div key={subject.id} className={`teacher-subject-card ${isAssigned ? 'assigned' : 'available'}`}>
                      <h4>{subject.name}</h4>
                      <div className="subject-notes-count">
                        {globalViewMode === 'student' ? `Public Notes: ${publicNotes.length}` : `Notes: ${notes.length}`}
                      </div>
                      <div className="subject-status">
                        {globalViewMode === 'student' 
                          ? (publicNotes.length > 0 ? '📚 Study Available' : '📝 No Content')
                          : (isAssigned ? '✅ Assigned' : '🔓 Available')
                        }
                      </div>
                      <button 
                        className={`manage-subject-btn ${isAssigned ? 'assigned' : 'view-only'}`}
                        onClick={() => {
                          setCurrentSubjectPage(subject.id)
                          setActiveTab('notes')
                        }}
                        title={isAssigned 
                          ? (hasContent ? 'Manage your content for this subject' : 'Add new content for this subject')
                          : 'View content created by other teachers'
                        }
                      >
                        {globalViewMode === 'student' 
                          ? (publicNotes.length > 0 ? 'Study Notes' : 'No Content Yet')
                          : (isAssigned 
                              ? (hasContent ? 'Manage Content' : 'Add Content')
                              : 'View Content'
                            )
                        }
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="teacher-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => {
                    if (teacherSubjects.length > 0) {
                      setCurrentSubjectPage(teacherSubjects[0])
                      setActiveTab('notes')
                    } else {
                      alert('You need to be assigned subjects first. Contact an admin.')
                    }
                  }}
                >
                  📝 Add New Content
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('notes')}
                >
                  📖 Review All Notes
                </button>
                <button 
                  className="action-btn ai-quiz"
                  onClick={() => setActiveTab('ai')}
                >
                  🤖 Create AI Quiz
                </button>
                <button 
                  className="action-btn load-all"
                  onClick={loadAllSubjectNotes}
                  disabled={contentLoading.allSubjects}
                  title="Load notes for all subjects"
                >
                  {contentLoading.allSubjects ? (
                    <>
                      <div className="button-spinner"></div>
                      Loading...
                    </>
                  ) : (
                    '📚 Load All Notes'
                  )}
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {activeTab === 'admin' && isAdmin && (
          <div className="admin-section">
            <h2>👑 Admin Control Panel</h2>
            <p className="admin-subtitle">Welcome, {user?.displayName || user?.email}</p>
            
            <div className="admin-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <span className="stat-number">{adminStats.totalUsers || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Total Feedback</h3>
                <span className="stat-number">{adminStats.totalFeedback || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <span className="stat-number">{adminStats.activeUsers || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Total Teachers</h3>
                <span className="stat-number">{adminStats.totalTeachers || 0}</span>
              </div>
            </div>

            {/* Teacher Management */}
            <div className="admin-teachers">
              <h3>👨‍🏫 Teacher Management</h3>
              <div className="teacher-controls">
                <button className="add-teacher-btn" onClick={() => setShowAddTeacher(true)}>
                  + Add Teacher
                </button>
                <button 
                  className="cleanup-btn"
                  onClick={cleanupPlaceholderNotes}
                  title="Clean up any placeholder notes to fix editing issues"
                >
                  🧹 Cleanup Notes
                </button>
              </div>
              
              {/* Debug Controls - Admin Only */}
              <div className="debug-controls">
                <h4>🔧 Debug Controls</h4>
                <div className="debug-buttons">
                  <button 
                    className="debug-btn"
                    onClick={debugRefreshNotes}
                    title="Debug: Manually refresh notes for current subject"
                  >
                    🐛 Debug Refresh
                  </button>
                  <button 
                    className="debug-btn"
                    onClick={debugCheckDatabase}
                    title="Debug: Check database status and content"
                  >
                    🗄️ Check DB
                  </button>
                  <button 
                    className="debug-btn"
                    onClick={loadAllSubjectNotes}
                    disabled={contentLoading.allSubjects}
                    title="Load notes for all subjects"
                  >
                    📚 Load All Notes
                  </button>
                  <button 
                    className="debug-btn danger"
                    onClick={clearAllNotes}
                    disabled={contentLoading.allSubjects}
                    title="Clear all notes and topics from database"
                  >
                    🗑️ Clear Database
                  </button>
                </div>
              </div>
              
              <div className="teachers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Subjects</th>
                      <th>Added Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>{teacher.email}</td>
                        <td>{teacher.displayName || 'N/A'}</td>
                        <td>
                          <div className="teacher-subjects">
                            {teacher.subjects?.map((subject, index) => (
                              <span key={index} className="teacher-subject-tag">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{teacher.addedAt ? new Date(teacher.addedAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <div className="teacher-actions">
                            <button 
                              className="add-subjects-btn"
                              onClick={() => openAddSubjectsModal(teacher)}
                              title="Add more subjects to this teacher"
                            >
                              + Add Subjects
                            </button>
                            <button 
                              className="remove-teacher-btn"
                              onClick={() => removeTeacherPermission(teacher.id)}
                              disabled={loadingStates[`remove-teacher-${teacher.id}`]}
                            >
                              {loadingStates[`remove-teacher-${teacher.id}`] ? (
                                <div className="button-spinner small"></div>
                              ) : (
                                'Remove'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Teacher Modal */}
            {showAddTeacher && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Add New Teacher</h3>
                    <button className="close-modal-btn" onClick={() => setShowAddTeacher(false)}>
                      ×
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    <div className="form-group">
                      <label htmlFor="teacher-email">Teacher Email:</label>
                      <input
                        type="email"
                        id="teacher-email"
                        value={newTeacherEmail}
                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                        placeholder="Enter teacher's email address"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Select Subjects:</label>
                      <div className="subject-selection-grid">
                        {subjectBlocks.map((block) => (
                          <div key={block.name} className="subject-block-selection">
                            <h4>{block.name}</h4>
                            <div className="subject-options">
                              {block.subjects.map((subject) => (
                                <label key={subject.id} className="subject-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={newTeacherSubjects.includes(subject.id)}
                                    onChange={() => toggleTeacherSubject(subject.id)}
                                  />
                                  <span>{subject.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowAddTeacher(false)}>
                      Cancel
                    </button>
                    <button 
                      className="confirm-btn" 
                      onClick={handleAddTeacher}
                      disabled={loadingStates['add-teacher']}
                    >
                      {loadingStates['add-teacher'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Adding...
                        </>
                      ) : successStates['add-teacher'] ? (
                        <>
                          <div className="button-tick">✓</div>
                          Added!
                        </>
                      ) : (
                        'Add Teacher'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Subjects to Existing Teacher Modal */}
            {showAddSubjects && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Add Subjects to Teacher</h3>
                    <button className="close-modal-btn" onClick={() => setShowAddSubjects(false)}>
                      ×
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    <div className="form-group">
                      <label>Teacher:</label>
                      <div className="selected-teacher-info">
                        <strong>{selectedTeacherForSubjects?.email}</strong>
                        <div className="current-subjects">
                          <span>Current subjects: </span>
                          {selectedTeacherForSubjects?.subjects?.map((subject, index) => (
                            <span key={index} className="current-subject-tag">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Select Additional Subjects:</label>
                      <div className="subject-selection-grid">
                        {subjectBlocks.map((block) => (
                          <div key={block.name} className="subject-block-selection">
                            <h4>{block.name}</h4>
                            <div className="subject-options">
                              {block.subjects.map((subject) => (
                                <label key={subject.id} className="subject-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={additionalSubjects.includes(subject.id)}
                                    onChange={() => toggleAdditionalSubject(subject.id)}
                                  />
                                  <span>{subject.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowAddSubjects(false)}>
                      Cancel
                    </button>
                    <button 
                      className="confirm-btn" 
                      onClick={handleAddSubjectsToTeacher}
                      disabled={loadingStates['add-subjects']}
                    >
                      {loadingStates['add-subjects'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Adding...
                        </>
                      ) : successStates['add-subjects'] ? (
                        <>
                          <div className="button-tick">✓</div>
                          Added!
                        </>
                      ) : (
                        'Add Subjects'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-users">
              <h3>User Management</h3>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Subjects</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((userData) => (
                      <tr key={userData.id}>
                        <td>{userData.email}</td>
                        <td>{userData.displayName || 'N/A'}</td>
                        <td>{userData.selectedSubjects?.length || 0} subjects</td>
                        <td>{userData.lastUpdated ? new Date(userData.lastUpdated.toDate()).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <button 
                            className="delete-user-btn"
                            onClick={() => deleteUser(userData.id)}
                            disabled={loadingStates[`delete-user-${userData.id}`]}
                          >
                            {loadingStates[`delete-user-${userData.id}`] ? (
                              <div className="button-spinner small"></div>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Topic Modal */}
        {showAddTopic && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Create New Topic with Content</h3>
                <button className="close-modal-btn" onClick={() => setShowAddTopic(false)}>
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="form-group">
                  <label htmlFor="topic-name">Topic Name:</label>
                  <input
                    type="text"
                    id="topic-name"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Enter topic name (e.g., Topic 1: Cell Biology)"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="topic-content">Document Content:</label>
                  
                  {/* Rich Text Toolbar */}
                  <div className="rich-text-toolbar">
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('bold')}
                      title="Make text bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('italic')}
                      title="Make text italic"
                    >
                      <em>I</em>
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('bullet')}
                      title="Add bullet point"
                    >
                      •
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('number')}
                      title="Add numbered list"
                    >
                      1.
                    </button>
                    <button 
                      type="button" 
                      className="format-btn image-btn" 
                      onClick={() => setShowImageInput(!showImageInput)}
                      title="Insert image"
                    >
                      🖼️
                    </button>
                  </div>
                  
                  {/* Image Input */}
                  {showImageInput && (
                    <div className="image-input-container">
                      <input
                        type="url"
                        placeholder="Enter image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="image-url-input"
                      />
                      <button 
                        type="button" 
                        className="insert-image-btn"
                        onClick={insertImage}
                      >
                        Insert Image
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    id="topic-content"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter your document content here. You can include:

**Bold text** and *italic text*
• Bullet points
1. Numbered lists
• Key concepts
• Examples and explanations
• Important formulas
• Study tips

Use the toolbar above to format your text!"
                    rows="15"
                    className="rich-content-textarea"
                  />
                  <div className="content-tips">
                    <p><strong>💡 Tips for great content:</strong></p>
                    <ul>
                      <li>Use clear headings and subheadings</li>
                      <li>Include examples and real-world applications</li>
                      <li>Break down complex concepts into simple steps</li>
                      <li>Add key formulas and definitions</li>
                      <li>Use bullet points for easy reading</li>
                    </ul>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="topic-public"
                      checked={newNoteIsPublic}
                      onChange={(e) => setNewNoteIsPublic(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Make this content public for students to view
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAddTopic(false)}>
                  Cancel
                </button>
                                    <button 
                      className="confirm-btn" 
                      onClick={handleAddTopic}
                      disabled={loadingStates['add-topic']}
                    >
                      {loadingStates['add-topic'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Adding...
                        </>
                      ) : successStates['add-topic'] ? (
                        <>
                          <div className="button-tick">✓</div>
                          Added!
                        </>
                      ) : (
                        'Create Topic with Content'
                      )}
                    </button>
              </div>
            </div>
          </div>
        )}




        {/* Edit Note Modal */}
        {showEditNote && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Note</h3>
                <button className="close-modal-btn" onClick={() => setShowEditNote(false)}>
                  ×
                </button>
              </div>
              
              <div className="modal-content">

                
                                                    <div className="form-group">
                  <label htmlFor="edit-note-content">Document Content:</label>
                  
                  {/* Rich Text Toolbar */}
                  <div className="rich-text-toolbar">
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('bold')}
                      title="Make text bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('italic')}
                      title="Make text italic"
                    >
                      <em>I</em>
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('bullet')}
                      title="Add bullet point"
                    >
                      •
                    </button>
                    <button 
                      type="button" 
                      className="format-btn" 
                      onClick={() => formatText('number')}
                      title="Add numbered list"
                    >
                      1.
                    </button>
                    <button 
                      type="button" 
                      className="format-btn image-btn" 
                      onClick={() => setShowImageInput(!showImageInput)}
                      title="Insert image"
                    >
                      🖼️
                    </button>
                  </div>
                  
                  {/* Image Input */}
                  {showImageInput && (
                    <div className="image-input-container">
                      <input
                        type="url"
                        placeholder="Enter image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="image-url-input"
                      />
                      <button 
                        type="button" 
                        className="insert-image-btn"
                        onClick={insertImage}
                      >
                        Insert Image
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    id="edit-note-content"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Edit your document content here. Use the toolbar above to format your text..."
                    rows="15"
                    className="rich-content-textarea"
                  />
                </div>
                    
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="edit-note-public"
                          checked={newNoteIsPublic}
                          onChange={(e) => setNewNoteIsPublic(e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Make this note public for students to view
                      </label>
                    </div>
              </div>
              
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowEditNote(false)}>
                  Cancel
                </button>
                                    <button 
                      className="confirm-btn" 
                      onClick={handleEditNote}
                      disabled={loadingStates['edit-note']}
                    >
                      {loadingStates['edit-note'] ? (
                        <>
                          <div className="button-spinner"></div>
                          Updating...
                        </>
                      ) : successStates['edit-note'] ? (
                        <>
                          <div className="button-tick">✓</div>
                          Updated!
                        </>
                      ) : (
                        'Update Note'
                      )}
                    </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Page Note View */}
        {fullPageNote && (
          <div className="full-page-note-overlay">
            <div className="full-page-note">
              <div className="full-page-note-header">
                <div className="full-page-note-title">
                  <h1>{fullPageNote.title}</h1>
                  <div className="full-page-note-meta">
                    <span className="note-topic-badge">{fullPageNote.topic}</span>
                    {fullPageNote.teacherName && (
                      <span className="note-teacher-badge">👨‍🏫 {fullPageNote.teacherName}</span>
                    )}
                    {fullPageNote.isPublic === false && (globalViewMode !== 'student') && (
                      <span className="private-badge">🔒 Private</span>
                    )}
                  </div>
                </div>
                <div className="full-page-note-controls">
                  {isTeacher && teacherSubjects.includes(currentSubjectPage) && (globalViewMode === 'teacher' || globalViewMode === 'normal') && (
                    <>
                      <button 
                        className="edit-document-btn"
                        onClick={() => {
                          startEditNote(fullPageNote)
                          closeFullPageNote()
                        }}
                      >
                        ✏️ Edit Document
                      </button>
                      <button 
                        className={`toggle-public-btn ${fullPageNote.isPublic ? 'make-private' : 'make-public'}`}
                        onClick={() => toggleNotePublic(fullPageNote.id, !fullPageNote.isPublic)}
                        title={fullPageNote.isPublic ? 'Make Private' : 'Make Public'}
                        disabled={loadingStates[`toggle-${fullPageNote.id}`]}
                      >
                        {loadingStates[`toggle-${fullPageNote.id}`] ? (
                          <div className="button-spinner small"></div>
                        ) : successStates[`toggle-${fullPageNote.id}`] ? (
                          <>
                            <div className="button-tick small">✓</div>
                            Success!
                          </>
                        ) : (
                          fullPageNote.isPublic ? '🔒 Make Private' : '🌐 Make Public'
                        )}
                      </button>
                    </>
                  )}
                  <button className="close-full-page-btn" onClick={closeFullPageNote}>
                    ✕ Close
                  </button>
                </div>
              </div>
              
              <div className="full-page-note-content">
                <div className="document-content" 
                     dangerouslySetInnerHTML={{ __html: renderMarkdownContent(fullPageNote.content) }}>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 IB Study Hub - Your comprehensive revision companion</p>
      </footer>
    </div>
  )
}

export default App

