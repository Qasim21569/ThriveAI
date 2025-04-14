'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Divider, 
  TextField, 
  InputAdornment,
  Drawer,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import FolderIcon from '@mui/icons-material/Folder';
import { getUserConversations, deleteConversation, updateConversationTitle } from '@/lib/firebase/conversations';

// Define the conversation type
type Conversation = {
  id: string;
  title: string;
  mode: 'career' | 'fitness' | 'finance' | 'mental' | 'general';
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  createdAt: any;
  updatedAt: any;
};

// Type for the result from Firebase functions
interface FirebaseResult {
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}

type ConversationHistoryProps = {
  userId: string;
  onSelectConversation: (conversation: Conversation) => void;
  currentMode?: 'career' | 'fitness' | 'finance' | 'mental' | 'general';
  accentColor: string;
};

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  userId,
  onSelectConversation,
  currentMode,
  accentColor
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<string | null>(currentMode || null);

  // Fetch conversations when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, filterMode]);

  // Filter conversations when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(
        conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const result = await getUserConversations(userId, filterMode as string | undefined) as FirebaseResult;
      if (result.success) {
        setConversations(result.conversations || []);
        setFilteredConversations(result.conversations || []);
      } else {
        console.error('Failed to fetch conversations:', result.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEditClick = (conversation: Conversation) => {
    setEditingConversation(conversation);
    setNewTitle(conversation.title);
  };

  const handleSaveTitle = async () => {
    if (editingConversation && newTitle.trim()) {
      try {
        const result = await updateConversationTitle(editingConversation.id, newTitle.trim()) as FirebaseResult;
        if (result.success) {
          // Update the conversation in the local state
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === editingConversation.id 
                ? { ...conv, title: newTitle.trim() } 
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Error updating conversation title:', error);
      }
      setEditingConversation(null);
    }
  };

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) {
      try {
        const result = await deleteConversation(conversationToDelete) as FirebaseResult;
        if (result.success) {
          // Remove the conversation from the local state
          setConversations(prevConversations => 
            prevConversations.filter(conv => conv.id !== conversationToDelete)
          );
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
      setDeleteConfirmOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setConversationToDelete(null);
  };

  const handleFilterByMode = (mode: string | null) => {
    setFilterMode(mode);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    // Handle Firestore timestamps
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'career':
        return '#3f51b5';
      case 'fitness':
        return '#4caf50';
      case 'finance':
        return '#ff9800';
      case 'mental':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    if (!isDrawerOpen) {
      // Refresh conversations when opening the drawer
      fetchConversations();
    }
  };

  return (
    <>
      <Tooltip title="Conversation History">
        <IconButton 
          onClick={toggleDrawer}
          sx={{ 
            color: accentColor,
            '&:hover': { 
              backgroundColor: `${accentColor}20` 
            } 
          }}
        >
          <HistoryIcon />
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 350 },
            boxSizing: 'border-box',
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Conversation History</Typography>
          <IconButton onClick={toggleDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="All" 
            onClick={() => handleFilterByMode(null)}
            color={filterMode === null ? 'primary' : 'default'}
            variant={filterMode === null ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Career" 
            onClick={() => handleFilterByMode('career')}
            color={filterMode === 'career' ? 'primary' : 'default'}
            variant={filterMode === 'career' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Fitness" 
            onClick={() => handleFilterByMode('fitness')}
            color={filterMode === 'fitness' ? 'primary' : 'default'}
            variant={filterMode === 'fitness' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Finance" 
            onClick={() => handleFilterByMode('finance')}
            color={filterMode === 'finance' ? 'primary' : 'default'}
            variant={filterMode === 'finance' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Mental" 
            onClick={() => handleFilterByMode('mental')}
            color={filterMode === 'mental' ? 'primary' : 'default'}
            variant={filterMode === 'mental' ? 'filled' : 'outlined'}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : filteredConversations.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredConversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'rgba(0, 0, 0, 0.04)' 
                    },
                    borderLeft: `3px solid ${getModeColor(conversation.mode)}`,
                    pl: 2
                  }}
                  onClick={() => {
                    onSelectConversation(conversation);
                    toggleDrawer();
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex' }}>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(conversation);
                        }}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conversation.id);
                        }}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {/* Title */}
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ 
                        display: 'block', 
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {conversation.title}
                    </Typography>
                    
                    {/* Date and mode tag */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'inline' }}
                      >
                        {formatDate(conversation.updatedAt)}
                      </Typography>
                      <Box 
                        component="span" 
                        sx={{ 
                          ml: 1, 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: `${getModeColor(conversation.mode)}20`,
                          color: getModeColor(conversation.mode),
                          fontWeight: 'medium',
                          px: 1,
                          py: 0.2,
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {conversation.mode}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6,
              px: 2,
              textAlign: 'center'
            }}
          >
            <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No conversations found</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {searchTerm 
                ? "Try a different search term" 
                : "Start a new conversation to see it here"}
            </Typography>
          </Box>
        )}
      </Drawer>

      {/* Edit Title Dialog */}
      <Dialog open={!!editingConversation} onClose={() => setEditingConversation(null)}>
        <DialogTitle>Edit Conversation Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingConversation(null)}>Cancel</Button>
          <Button onClick={handleSaveTitle} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConversationHistory;
