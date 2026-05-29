import React, { useEffect, useMemo, useRef, useState } from "react"
import { processDocument } from "../services/document.service"
import type {
	IDocumentAnalysisResult,
	IDocumentProcessEntry
} from "../types/document.types"
