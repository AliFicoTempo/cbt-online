export interface Question {
  question_id: string;
  question_type: string;
  question_text: string;
  question_image_url: string;
}

export interface Answer {
  question_id: string;
  answer_id: string;
  answer_text: string;
  answer_image_url: string;
  is_true: string;
}

export interface Category {
  category_id: string;
  category_text: string;
}

export interface SubCategory {
  category_id: string;
  subcat_id: string;
  subcat_text: string;
}

export interface AnswerScore {
  answer_id: string;
  subcat_id: string;
  score_value: string;
}

export interface Participant {
  user_id: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  nik_ktp: string;
  alamat_lengkap: string;
  no_telp: string;
  email: string;
  timestamp: string;
  final_score: string;
  status_test: string;
  result_pdf: string;
}

export interface ParticipantAnswer {
  user_id: string;
  question_id: string;
  answer_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}